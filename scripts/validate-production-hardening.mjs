import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => {
  const absolute = resolve(root, path);
  assert.ok(existsSync(absolute), `missing hardening file: ${path}`);
  return readFileSync(absolute, "utf8");
};
const files = (directory) => readdirSync(resolve(root, directory), { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => resolve(entry.parentPath, entry.name));

const adminAction = read("app/admin/(protected)/groundwater/actions.ts");
const csvAction = read("app/admin/(protected)/groundwater/import/actions.ts");
const csvParser = read("lib/admin-csv-import.ts");
const adminData = read("lib/admin-groundwater.server.ts");
const adminCss = read("app/admin/admin.css");
const auth = read("lib/admin-auth.server.ts");
const explorerAction = read("app/app/explorer/actions.ts");
const chatRoute = read("app/api/chat/route.ts");
const chatRequest = read("lib/ai/chat-request.ts");
const chatClient = read("app/app/chat/chat-client.tsx");
const provider = read("lib/ai/ai-provider.server.ts");
const queries = read("lib/groundwater-queries.server.ts");
const baseMigration = read("supabase/migrations/20260922152344_create_groundwater_schema.sql");
const adminMigration = read("supabase/migrations/20261001120000_add_admin_authorization.sql");
const importMigration = read("supabase/migrations/20261015120000_add_admin_csv_import.sql");
const hardeningMigration = read("supabase/migrations/20261016120000_production_hardening.sql");
const nextConfig = read("next.config.ts");
const callback = read("app/auth/callback/route.ts");
const gitignore = read(".gitignore");
const envExample = read(".env.example");
const packageJson = JSON.parse(read("package.json"));

// Server Actions are independent entry points: authorize before every read or mutation.
assert.ok(adminAction.indexOf("await requireAdmin()") < adminAction.indexOf(".update(update)"));
assert.equal((csvAction.match(/await requireAdmin\(\)/g) ?? []).length, 2);
assert.ok(explorerAction.indexOf("await getCurrentUser()") < explorerAction.indexOf("getAssessmentUnits(district)"));
assert.ok(explorerAction.indexOf("await getCurrentUser()") < explorerAction.indexOf("getAssessment(district"));
assert.match(auth, /\.from\("user_roles"\)[\s\S]*\.eq\("user_id", user\.id\)[\s\S]*\.eq\("role", "admin"\)/);
assert.doesNotMatch(auth, /setTimeout|ttl|globalThis|new Map/);

// Admin edits use a closed field allowlist, optimistic concurrency and safe duplicate handling.
assert.match(adminAction, /const REQUIRED_NUMBERS = \[/);
assert.match(adminAction, /expected_updated_at/);
assert.match(adminAction, /\.eq\("updated_at", expectedUpdatedAt\)/);
assert.match(adminAction, /error\?\.code === "23505"/);
assert.match(adminAction, /year !== EDITABLE_YEAR/);
assert.match(adminAction, /MAX_GROUNDWATER_VALUE/);
assert.doesNotMatch(adminAction, /Object\.fromEntries\(formData|\.update\(Object\.fromEntries|\.update\(\.\.\./);
assert.match(adminData, /normalizeSearch/);
assert.match(adminData, /filters\.year !== undefined && filters\.year !== 2024/);
assert.match(adminData, /select\("id", \{ count: "exact", head: true \}\)/);
assert.match(adminData, /safeDataPage = Math\.min\(page, pageCount\)/);
assert.match(adminCss, /\.admin-site \{ max-width: 100%; overflow-x: hidden; \}/);

// RLS/grants keep public users read-only, admin identity private and role changes live per statement.
assert.match(baseMigration, /for select[\s\S]*to anon, authenticated[\s\S]*using \(true\)/i);
assert.doesNotMatch(`${baseMigration}\n${adminMigration}\n${importMigration}\n${hardeningMigration}`, /create policy[\s\S]{0,120}groundwater_assessments[\s\S]{0,120}for delete/i);
assert.doesNotMatch(`${baseMigration}\n${adminMigration}\n${importMigration}\n${hardeningMigration}`, /grant delete[\s\S]{0,120}groundwater_assessments/i);
const publicSelect = adminMigration.match(/grant select \(([\s\S]*?)\) on table public\.groundwater_assessments to anon, authenticated/i)?.[1] ?? "";
assert.ok(publicSelect);
assert.doesNotMatch(publicSelect, /updated_by/i);
assert.match(adminMigration, /user_roles_read_own[\s\S]*user_id = \(select auth\.uid\(\)\)/i);
assert.match(importMigration, /dataset_imports_admin_read[\s\S]*public\.is_admin\(\)/i);
assert.match(importMigration, /security invoker/i);
assert.doesNotMatch(importMigration, /security definer/i);
assert.match(hardeningMigration, /groundwater_assessments_supported_domain_check/);
assert.match(hardeningMigration, /year = 2024[\s\S]*source_year = 2024[\s\S]*state_code = 'MH'/i);
assert.match(hardeningMigration, /public\.is_admin\(\)/);

// CSV remains bounded, reparsed on confirmation, idempotent and non-overwriting.
for (const invariant of [/512 \* 1024/, /CSV_MAX_ROWS = 1000/, /CSV_YEAR = 2024/, /CSV_MAX_NUMERIC_VALUE/, /TextDecoder\("utf-8", \{ fatal: true \}\)/, /max_record_size: 16384/, /parsedNumber < 0/]) {
  assert.match(csvParser, invariant);
}
assert.match(csvParser, /csv-parse\/sync/);
assert.doesNotMatch(csvParser, /split\(["']\,["']\)/);
assert.equal((csvAction.match(/readUpload\(formData\)/g) ?? []).length, 2);
assert.match(csvAction, /preview_sha256/);
assert.match(importMigration, /on conflict \(district, assessment_unit, year\) do nothing/i);
assert.doesNotMatch(importMigration, /do update|force|overwrite all/i);
for (const source of [csvAction, importMigration]) assert.doesNotMatch(source, /data\/(?:raw|processed)|writeFile|appendFile/);

// Chat is authenticated, byte-bounded, shape-bounded and provider-bounded.
assert.ok(chatRoute.indexOf("await getCurrentUser()") < chatRoute.indexOf("readChatRequestBody(request)"));
assert.ok(chatRoute.indexOf("readChatRequestBody(request)") < chatRoute.lastIndexOf("answerGroundwaterQuestion("));
assert.match(chatRequest, /CHAT_MAX_REQUEST_BYTES = 64 \* 1024/);
assert.match(chatRequest, /MAX_CONTEXT_QUESTIONS/);
assert.match(chatRequest, /CHAT_MAX_MESSAGE_CHARS = 2_000/);
assert.match(chatRequest, /reader\.cancel\(\)/);
assert.match(chatClient, /requestLock\.current/);
assert.match(provider, /import "server-only"/);
assert.match(queries, /import "server-only"/);
assert.match(provider, /AbortController/);
assert.match(provider, /max_output_tokens/);
assert.match(provider, /store: false/);
assert.match(provider, /class OpenRouterProvider/);
assert.match(provider, /https:\/\/openrouter\.ai\/api\/v1\/chat\/completions/);
assert.doesNotMatch(provider, /console\.(?:log|info|warn|error|debug)/);

// Secrets stay server-only and redirects/remote resources are fixed by application code.
const browserFacing = [
  ...files("app").filter((path) => [".ts", ".tsx"].includes(extname(path))),
  ...files("lib").filter((path) => [".ts", ".tsx"].includes(extname(path))),
].map((path) => readFileSync(path, "utf8")).join("\n");
assert.doesNotMatch(browserFacing, /NEXT_PUBLIC_(?:AI|OPENAI|OPENROUTER|SUPABASE_SERVICE_ROLE)/);
assert.doesNotMatch(envExample, /NEXT_PUBLIC_(?:AI|OPENAI|OPENROUTER|SUPABASE_SERVICE_ROLE)/);
for (const variable of ["OPENROUTER_API_KEY", "OPENROUTER_INTENT_MODEL", "OPENROUTER_ANSWER_MODEL"]) assert.ok(envExample.includes(`${variable}=`));
assert.doesNotMatch(browserFacing, /sk-[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/);
for (const path of [...files("app"), ...files("lib")].filter((item) => [".ts", ".tsx"].includes(extname(item)))) {
  const source = readFileSync(path, "utf8");
  for (const line of source.split(/\r?\n/).filter((item) => /console\.(?:log|info|warn|error|debug)/.test(item))) {
    assert.ok(path.endsWith("local-groundwater-engine.server.ts") && line.includes("[groundwater timing]") && !/question|message|key|token|header/i.test(line), `${path} contains unsafe application logging`);
  }
}
assert.match(callback, /new URL\("\/app", requestUrl\.origin\)/);
assert.doesNotMatch(callback, /searchParams\.get\(["'](?:next|redirect|returnTo)/);
assert.match(read("app/app/analytics/district-boundaries.ts"), /fetch\("\/maps\/maharashtra-districts\.geojson"\)/);
assert.match(read("app/app/analytics/leaflet-map.tsx"), /https:\/\/\{s\}\.tile\.openstreetmap\.org/);

// Conservative response headers and repository hygiene.
for (const header of ["X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Frame-Options"]) assert.ok(nextConfig.includes(header));
assert.match(gitignore, /^\.env\*$/m);
assert.match(gitignore, /^!\.env\.example$/m);
assert.ok(existsSync(resolve(root, "app/error.tsx")) && existsSync(resolve(root, "app/not-found.tsx")));
assert.ok(packageJson.dependencies.next.replace(/^[^\d]*/, "") >= "16.4.2");
assert.ok(packageJson.dependencies["csv-parse"].replace(/^[^\d]*/, "") >= "7.0.3");

// Every explicit new-tab link must isolate its opener.
for (const path of files("app").filter((item) => extname(item) === ".tsx")) {
  const source = readFileSync(path, "utf8");
  for (const match of source.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/g)) {
    assert.match(match[0], /rel=["'][^"']*noopener[^"']*noreferrer[^"']*["']/i, `${path} has an unsafe new-tab link`);
  }
}

console.log("Production hardening structural validation passed: independent server authorization, RLS/grant boundaries, allowlisted edits, stale-write and duplicate protection, adversarial CSV limits, bounded authenticated AI requests, secret boundaries, fixed redirects/resources, security headers, dependency floors, and repository hygiene.");
console.log("This structural validator does not prove penetration security, live role configuration, deployment headers, or durable rate limiting.");
