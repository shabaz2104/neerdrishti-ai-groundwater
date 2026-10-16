import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
function read(relativePath) {
  const path = resolve(root, relativePath);
  assert.ok(existsSync(path), `missing admin file: ${relativePath}`);
  return readFileSync(path, "utf8");
}

const migration = read("supabase/migrations/20261001120000_add_admin_authorization.sql");
const authorization = read("lib/admin-auth.server.ts");
const dataAccess = read("lib/admin-groundwater.server.ts");
const action = read("app/admin/(protected)/groundwater/actions.ts");
const protectedLayout = read("app/admin/(protected)/layout.tsx");
const login = read("app/admin/login/admin-login-form.tsx");
const editForm = read("app/admin/(protected)/groundwater/[id]/record-form.tsx");
const browserClient = read("lib/supabase/client.ts");
const baseMigration = read("supabase/migrations/20260922152344_create_groundwater_schema.sql");
const envExample = read(".env.example");

for (const path of [
  "app/admin/(protected)/page.tsx",
  "app/admin/(protected)/groundwater/page.tsx",
  "app/admin/(protected)/groundwater/[id]/page.tsx",
  "app/admin/login/page.tsx",
  "docs/admin-panel.md",
]) assert.ok(existsSync(resolve(root, path)), `missing admin route or documentation: ${path}`);

assert.match(migration, /create table public\.user_roles/i);
assert.match(migration, /references auth\.users\(id\)/i);
assert.match(migration, /primary key \(user_id, role\)/i);
assert.match(migration, /check \(role in \('admin'\)\)/i);
assert.match(migration, /enable row level security/i);
assert.match(migration, /create function public\.is_admin\(\)/i);
assert.match(migration, /create policy groundwater_assessments_admin_update/i);
assert.match(migration, /using \(\(select public\.is_admin\(\)\)\)/i);
assert.match(migration, /grant update \([\s\S]*stage_of_groundwater_extraction_percent[\s\S]*\) on table public\.groundwater_assessments to authenticated/i);
assert.doesNotMatch(migration, /grant (insert|delete) .*groundwater_assessments.*authenticated/i);
assert.match(migration, /add column updated_by uuid references auth\.users/i);
assert.match(migration, /revoke select on table public\.groundwater_assessments from anon, authenticated/i);
assert.match(migration, /grant select \([\s\S]*updated_at[\s\S]*\) on table public\.groundwater_assessments to anon, authenticated/i);
const publicSelectGrant = migration.match(/grant select \(([\s\S]*?)\) on table public\.groundwater_assessments to anon, authenticated/i)?.[1] ?? "";
assert.doesNotMatch(publicSelectGrant, /updated_by/i, "public SELECT must exclude the admin audit identity");
assert.match(migration, /new\.updated_at = now\(\)/i);
assert.match(migration, /new\.updated_by = coalesce\(\(select auth\.uid\(\)\)/i);

assert.match(authorization, /import "server-only"/);
assert.match(authorization, /getAdminAccess/);
assert.match(authorization, /requireAdmin/);
assert.match(authorization, /\.from\("user_roles"\)/);
assert.match(protectedLayout, /getAdminAccess/);
assert.match(protectedLayout, /redirect/);
assert.match(action, /"use server"/);
assert.ok(action.indexOf("requireAdmin()") < action.indexOf(".update(update)"), "admin authorization must precede the update");
assert.match(action, /expected_updated_at/);
assert.match(action, /23505/);
assert.match(action, /ADMIN_CLASSIFICATIONS\.includes/);
assert.match(dataAccess, /import "server-only"/);
assert.doesNotMatch(editForm, /admin-auth\.server|admin-groundwater\.server/);
assert.match(login, /signInWithPassword/);
assert.doesNotMatch(login, /isAdmin\s*=|admin password/i);

assert.match(baseMigration, /for select[\s\S]*to anon, authenticated[\s\S]*using \(true\)/i);
assert.match(baseMigration, /No INSERT, UPDATE, or DELETE policy is created/i);
assert.doesNotMatch(browserClient, /SUPABASE_SERVICE_ROLE_KEY|service_role/i);
assert.doesNotMatch(envExample, /ADMIN_PASSWORD|NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/i);

for (const [name, source] of [["authorization", authorization], ["data access", dataAccess], ["update action", action]]) {
  assert.doesNotMatch(source, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY|console\.(log|error|warn)/, `${name} exposes or logs privileged material`);
}

console.log("Admin panel structural validation passed.");
console.log("  role model, server authorization, RLS update policy, audit trigger, stale-edit check, and secret boundaries: passed");
console.log("  note: live admin/normal-user authorization still requires configured test accounts");
