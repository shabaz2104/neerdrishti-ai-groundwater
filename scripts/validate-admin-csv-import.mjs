import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import ts from "typescript";

import {
  CSV_HEADERS, CSV_MAX_BYTES, CSV_MAX_ROWS, parseGroundwaterCsv, validateCsvFile,
} from "../lib/admin-csv-import.ts";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const encode = (text) => new TextEncoder().encode(text);
const source = read("data/processed/groundwater_2024_normalized.csv");
const normalized = parseGroundwaterCsv(encode(source));
assert.equal(normalized.totalRows, 359);
assert.equal(normalized.invalidRows, 0);
const base = normalized.rows[0].values;
const csv = (records, headers = CSV_HEADERS) => headers.join(",") + "\r\n" + records.map((row) => headers.map((key) => '"' + String(row[key] ?? "").replaceAll('"', '""') + '"').join(",")).join("\r\n");
const parseRows = (records) => parseGroundwaterCsv(encode(csv(records)));

assert.equal(parseRows([{ ...base, district: 'District, "quoted"', extraction: "0", stage_of_groundwater_extraction_percent: "" }]).rows[0].values.stage_of_groundwater_extraction_percent, null);
assert.equal(parseRows([{ ...base, extraction: "0" }]).rows[0].values.extraction, "0");
assert.equal(parseGroundwaterCsv(encode("\ufeff" + csv([base]))).invalidRows, 0);
assert.throws(() => parseGroundwaterCsv(encode("")), /empty/);
assert.throws(() => parseGroundwaterCsv(encode('district,assessment_unit\n"unclosed')), /Malformed/);
assert.throws(() => parseGroundwaterCsv(encode("wrong,headers\n1,2")), /Headers/);
assert.throws(() => parseGroundwaterCsv(encode(CSV_HEADERS.join(","))), /no assessment rows/);
assert.throws(() => parseGroundwaterCsv(new Uint8Array([0xff, 0xfe, 0x20])), /UTF-8/);
assert.throws(() => parseGroundwaterCsv(encode(csv([base]) + "\0")), /binary/);
for (const patch of [
  { classification: "unknown" }, { recharge: "NaN" }, { extraction: "Infinity" },
  { extraction: "-Infinity" }, { extraction: "1e2" }, { recharge: "" },
  { recharge: "-1" }, { recharge: "1000000000001" },
  { district: "" }, { assessment_unit: "" }, { year: "2025" }, { state_code: "KA" },
  { source_serial_number: "1.5" }, { stage_of_groundwater_extraction_percent: "bad" },
]) assert.equal(parseRows([{ ...base, ...patch }]).invalidRows, 1, JSON.stringify(patch));
assert.equal(parseRows([base, base]).invalidRows, 2);
assert.throws(() => parseRows(Array(CSV_MAX_ROWS + 1).fill(base)), /row limit/);
assert.throws(() => parseGroundwaterCsv(new Uint8Array(CSV_MAX_BYTES + 1)), /file limit/);
assert.throws(() => validateCsvFile({ name: "file.exe", size: 20, type: "text/csv" }), /csv/);
assert.throws(() => validateCsvFile({ name: "file.csv", size: 20, type: "image/png" }), /type/);
assert.throws(() => validateCsvFile({ name: "file.csv", size: 0, type: "text/csv" }), /empty/);

// Execute the real Server Actions with an isolated auth/database adapter. No live writes.
const actionPath = "app/admin/(protected)/groundwater/import/actions.ts";
const actionSource = read(actionPath);
const migration = read("supabase/migrations/20261015120000_add_admin_csv_import.sql");
const clientSource = read("app/admin/(protected)/groundwater/import/import-form.tsx");
const parserSource = read("lib/admin-csv-import.ts");
assert.ok(existsSync(resolve(root, "app/admin/(protected)/groundwater/import/page.tsx")));
assert.equal((actionSource.match(/await requireAdmin\(\)/g) ?? []).length, 2);
assert.match(actionSource, /parseGroundwaterCsv/);
assert.match(actionSource, /preview_sha256/);
assert.match(clientSource, /Import \$\{report\.newRows\} new records/);
assert.doesNotMatch(clientSource, /\.from\(|\.rpc\(|SUPABASE_SERVICE_ROLE_KEY/);
assert.match(parserSource, /csv-parse\/sync/);
assert.doesNotMatch(parserSource, /split\(["']\,["']\)/);
assert.match(migration, /for insert to authenticated with check \([\s\S]*public\.is_admin\(\)/i);
assert.match(migration, /on conflict \(district, assessment_unit, year\) do nothing/i);
assert.doesNotMatch(migration, /do update|security definer|execute format|grant.*to anon/i);
assert.match(migration, /dataset_imports_admin_read/);
assert.match(migration, /insert into public\.dataset_imports/);
assert.match(migration, /Administrator CSV upload \(unverified source\)/);

class AuthorizationError extends Error { constructor(status) { super("denied"); this.status = status; } }
let authStatus = "authorized";
let rpcCalls = [];
let rpcHandler = async (_name, args) => ({ data: args.p_rows.map((row) => ({ rowNumber: row.rowNumber, district: row.values.district, assessmentUnit: row.values.assessment_unit, status: "NEW" })), error: null });
const actualRequire = createRequire(import.meta.url);
const dependencies = {
  "next/cache": { revalidatePath() {} },
  "@/lib/admin-auth.server": {
    AdminAuthorizationError: AuthorizationError,
    requireAdmin: async () => {
      if (authStatus !== "authorized") throw new AuthorizationError(authStatus);
      return { supabase: { rpc: async (...args) => { rpcCalls.push(args); return rpcHandler(...args); } } };
    },
  },
  "@/lib/admin-csv-import": await import("../lib/admin-csv-import.ts"),
};
const compiled = ts.transpileModule(actionSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const compiledModule = { exports: {} };
new Function("require", "module", "exports", compiled)((name) => dependencies[name] ?? actualRequire(name), compiledModule, compiledModule.exports);
const { validateCsvImport, confirmCsvImport } = compiledModule.exports;
const form = () => { const data = new FormData(); data.set("file", new File([csv([base])], "fixture.csv", { type: "text/csv" })); return data; };
for (const status of ["unauthenticated", "forbidden"]) {
  authStatus = status;
  assert.ok((await validateCsvImport(form())).error);
  assert.ok((await confirmCsvImport(form())).error);
}
assert.equal(rpcCalls.length, 0, "unauthorized operations must never reach database RPCs");
authStatus = "authorized";
const invalidUpload = new FormData();
invalidUpload.set("file", new File([csv([{ ...base, recharge: "" }])], "invalid.csv", { type: "text/csv" }));
const invalidPreview = await validateCsvImport(invalidUpload);
assert.equal(invalidPreview.report.invalidRows, 1);
invalidUpload.set("confirm", "yes");
invalidUpload.set("preview_sha256", invalidPreview.report.sha256);
assert.ok((await confirmCsvImport(invalidUpload)).error);
assert.equal(rpcCalls.length, 0, "invalid rows must block database import");
const preview = await validateCsvImport(form());
assert.equal(preview.report.newRows, 1);
assert.equal(rpcCalls[0][0], "preview_groundwater_csv");
assert.ok((await confirmCsvImport(form())).error, "confirmation must be explicit");
const confirmed = form(); confirmed.set("confirm", "yes"); confirmed.set("preview_sha256", "changed");
assert.ok((await confirmCsvImport(confirmed)).error, "file hash must match the preview");
confirmed.set("preview_sha256", preview.report.sha256);
rpcHandler = async () => ({ data: { importId: "fixture-id", insertedRows: 1 }, error: null });
assert.equal((await confirmCsvImport(confirmed)).result.insertedRows, 1);
assert.equal(rpcCalls.at(-1)[0], "import_groundwater_csv");
rpcHandler = async () => ({ data: null, error: { message: "SECRET SQL provider details" } });
const failure = await confirmCsvImport(confirmed);
assert.ok(failure.error);
assert.doesNotMatch(failure.error, /SECRET|SQL/);

console.log("Admin CSV validation passed: parser fixtures, schema/year/numeric/null/duplicate/file limits, direct unauthorized action denial, explicit confirmation, and structural security checks.");
console.log("Database role/RLS/transaction tests run separately with scripts/test-admin-csv-database.mjs; deployed sessions still require manual verification.");
