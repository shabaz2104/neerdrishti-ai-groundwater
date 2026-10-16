import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CSV_HEADERS, parseGroundwaterCsv } from "../lib/admin-csv-import.ts";

// PGlite is installed into a disposable external directory, never the app bundle.
const dependencyRoot = process.argv[2];
if (!dependencyRoot) throw new Error("Pass the temporary directory containing node_modules/@electric-sql/pglite.");
const { PGlite } = await import(pathToFileURL(resolve(dependencyRoot, "node_modules/@electric-sql/pglite/dist/index.js")).href);
const db = new PGlite();
const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const parsed = parseGroundwaterCsv(new TextEncoder().encode(read("data/processed/groundwater_2024_normalized.csv")));
const fixtures = parsed.rows.slice(0, 4).map((row, index) => ({ ...row, rowNumber: index + 2 }));
const admin = "11111111-1111-4111-8111-111111111111";
const normal = "22222222-2222-4222-8222-222222222222";
const hash = "a".repeat(64);
async function session(role, user = "") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user]);
  await db.exec(`set role ${role}`);
}
async function preview(rows) {
  return (await db.query("select public.preview_groundwater_csv($1::jsonb) as result", [JSON.stringify(rows)])).rows[0].result;
}
async function ingest(rows, name = "fixture.csv") {
  return (await db.query("select public.import_groundwater_csv($1::jsonb, $2, $3) as result", [JSON.stringify(rows), name, hash])).rows[0].result;
}
async function count(table = "groundwater_assessments") {
  return Number((await db.query(`select count(*) as count from public.${table}`)).rows[0].count);
}
async function directInsert(row) {
  const columns = [...CSV_HEADERS, "source_year", "source_document", "source_reference"];
  const values = [...CSV_HEADERS.map((key) => row.values[key]), 2024, "Test fixture", "Local test"];
  return db.query(`insert into public.groundwater_assessments (${columns.join(",")}) values (${columns.map((_, i) => "$" + (i + 1)).join(",")})`, values);
}

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    insert into auth.users values ('${admin}'), ('${normal}');
  `);
  // gen_random_uuid is built into this PostgreSQL runtime; pgcrypto is otherwise unused.
  await db.exec(read("supabase/migrations/20260922152344_create_groundwater_schema.sql").replace("create extension if not exists pgcrypto;", ""));
  await db.exec(read("supabase/migrations/20261001120000_add_admin_authorization.sql"));
  await db.exec(read("supabase/migrations/20261015120000_add_admin_csv_import.sql"));
  await db.exec(read("supabase/migrations/20261016120000_production_hardening.sql"));
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [admin]);

  await session("anon");
  assert.equal(await count(), 0, "public read remains available");
  await assert.rejects(() => preview(fixtures), /permission denied/);
  await assert.rejects(() => ingest(fixtures), /permission denied/);
  await assert.rejects(() => directInsert(fixtures[0]), /permission denied/);
  await assert.rejects(() => db.query("update public.groundwater_assessments set recharge = 0"), /permission denied/);
  await assert.rejects(() => db.query("select uploaded_by from public.dataset_imports"), /permission denied/);
  await session("authenticated", normal);
  await assert.rejects(() => preview(fixtures), /Administrator access required/);
  await assert.rejects(() => ingest(fixtures), /Administrator access required/);
  await assert.rejects(() => directInsert(fixtures[0]), /row-level security/);
  await assert.rejects(() => db.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [normal]), /permission denied/);
  assert.equal(await count("dataset_imports"), 0, "normal users cannot see logs");
  await assert.rejects(() => db.query("select updated_by from public.groundwater_assessments"), /permission denied/);

  await session("authenticated", admin);
  assert.ok((await preview(fixtures.slice(0, 2))).every((row) => row.status === "NEW"));
  assert.equal(await count(), 0, "preview must not insert records");
  assert.equal(await count("dataset_imports"), 0, "preview must not write audit records");
  const inserted = await ingest(fixtures.slice(0, 2));
  assert.equal(inserted.insertedRows, 2);
  assert.equal(await count(), 2);
  assert.equal((await ingest(fixtures.slice(0, 2))).unchangedRows, 2);
  assert.equal(await count(), 2, "repeated imports must be idempotent");
  const equivalent = structuredClone(fixtures[0]);
  equivalent.values.recharge = "000" + equivalent.values.recharge + "000";
  assert.equal((await preview([equivalent]))[0].status, "UNCHANGED", "numeric formatting must compare by numeric value");

  const conflict = structuredClone(fixtures[1]); conflict.values.extraction = "0";
  const mixed = [fixtures[0], conflict, fixtures[2]];
  assert.deepEqual((await preview(mixed)).map((row) => row.status), ["UNCHANGED", "CONFLICT", "NEW"]);
  const mixedResult = await ingest(mixed);
  assert.equal(mixedResult.insertedRows, 1);
  assert.equal(mixedResult.unchangedRows, 1);
  assert.equal(mixedResult.conflictRows, 1);
  assert.equal((await preview([fixtures[1]]))[0].status, "UNCHANGED", "a conflict must never overwrite the stored row");

  const concurrent = fixtures[3];
  assert.equal((await preview([concurrent]))[0].status, "NEW");
  const otherUpload = structuredClone(concurrent); otherUpload.values.extraction = "0";
  await ingest([otherUpload]);
  const concurrentResult = await ingest([concurrent]);
  assert.equal(concurrentResult.insertedRows, 0);
  assert.equal(concurrentResult.conflictRows, 1, "a key created after preview must become a skipped conflict");
  const fullImport = await ingest(parsed.rows);
  assert.equal(fullImport.totalRows, 359);
  assert.equal(fullImport.insertedRows, 355);
  assert.equal(fullImport.unchangedRows, 3);
  assert.equal(fullImport.conflictRows, 1);
  assert.equal((await ingest(parsed.rows)).insertedRows, 0, "a full dataset reupload must insert no duplicates");
  await assert.rejects(() => ingest([fixtures[0], { ...fixtures[0], rowNumber: 50 }]), /Duplicate/);
  const invalid = structuredClone(fixtures[0]); invalid.values.year = "2025";
  await assert.rejects(() => ingest([invalid]), /Unsupported/);
  const polluted = structuredClone(fixtures[0]); polluted.values.updated_by = admin;
  await assert.rejects(() => ingest([polluted]), /contract/);
  const negative = structuredClone(fixtures[0]); negative.values.recharge = "-1";
  await assert.rejects(() => preview([negative]), /supported range/);
  const extreme = structuredClone(fixtures[0]); extreme.values.recharge = "1000000000001";
  await assert.rejects(() => ingest([extreme]), /supported range/);

  const protectedRowId = (await db.query("select id from public.groundwater_assessments order by id limit 1")).rows[0].id;
  await session("authenticated", normal);
  assert.equal((await db.query("update public.groundwater_assessments set recharge = 0 where id = $1 returning id", [protectedRowId])).rows.length, 0, "normal-user update must affect no rows");
  await session("authenticated", admin);
  await assert.rejects(() => db.query("update public.groundwater_assessments set updated_by = $1 where id = $2", [normal, protectedRowId]), /permission denied/);

  await session("postgres");
  await db.query("delete from public.user_roles where user_id = $1 and role = 'admin'", [admin]);
  await session("authenticated", admin);
  await assert.rejects(() => preview([fixtures[0]]), /Administrator access required/);
  assert.equal((await db.query("update public.groundwater_assessments set recharge = recharge where id = $1 returning id", [protectedRowId])).rows.length, 0, "revoked admin update must affect no rows");
  await session("postgres");
  await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [admin]);
  await session("authenticated", admin);

  await session("postgres");
  await db.exec(`create function public.test_fail_audit() returns trigger language plpgsql as $$
    begin if new.original_file_name = 'rollback.csv' then raise exception 'simulated audit failure'; end if; return new; end; $$;
    create trigger test_fail_audit before insert on public.dataset_imports for each row execute function public.test_fail_audit();`);
  await session("authenticated", admin);
  const before = await count(); const auditBefore = await count("dataset_imports");
  const rollbackRow = structuredClone(fixtures[0]); rollbackRow.values.assessment_unit = "LOCAL ROLLBACK FIXTURE";
  await assert.rejects(() => ingest([rollbackRow], "rollback.csv"), /simulated audit failure/);
  assert.equal(await count(), before, "an audit failure must roll back groundwater inserts");
  assert.equal(await count("dataset_imports"), auditBefore);
  const log = (await db.query("select uploaded_by, file_sha256, status from public.dataset_imports limit 1")).rows[0];
  assert.equal(log.uploaded_by, admin); assert.equal(log.file_sha256, hash);
  await assert.rejects(() => db.query("delete from public.groundwater_assessments"), /permission denied/);
  console.log("Admin CSV PostgreSQL tests passed: anon/normal-user insert/update/RPC denial, role-escalation denial, immediate admin-role revocation, protected-column denial, admin import, read/audit privacy, numeric-domain checks, unchanged/conflict/mixed rows, preview-confirm race, duplicate/schema checks, idempotence, and atomic rollback.");
  console.log("Executed all four repository migrations in disposable in-memory PostgreSQL; no production data was touched.");
} catch (error) {
  console.error("Database test failed:", error.message, error.where ?? error.position ?? "");
  process.exitCode = 1;
} finally { await db.close(); }
