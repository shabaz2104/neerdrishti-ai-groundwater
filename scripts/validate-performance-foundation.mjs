import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import ts from "typescript";

// Structural invariants only. This is NOT a runtime performance benchmark.
const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const provider = read("lib/ai/ai-provider.server.ts");
assert.match(provider, /import "server-only"/);
assert.doesNotMatch(provider, /NEXT_PUBLIC|console\./);
for (const path of ["lib/auth.server.ts", "lib/admin-auth.server.ts", "lib/supabase/server.ts"]) {
  const source = read(path);
  assert.match(source, /import \{ cache \} from "react"/);
  assert.match(source, /cache\(async/);
  assert.doesNotMatch(source, /unstable_cache|use cache|globalThis|new Map|setInterval/);
}
assert.match(read("lib/admin-auth.server.ts"), /getCurrentUserResult\(\)/);
assert.match(read("lib/admin-groundwater.server.ts"), /await requireAdmin\(\)/);
const records = read("app/admin/(protected)/groundwater/page.tsx");
assert.ok(records.indexOf("await requireAdmin()") < records.indexOf("await Promise.all("));
assert.match(records, /Promise\.all\(\[getAdminGroundwaterRecords\(filters\), getDistricts\(\)\]\)/);
assert.match(records, /prefetch=\{false\} href=\{`\/admin\/groundwater\//);
assert.match(records, /prefetch=\{false\} href=\{pageHref/);
assert.match(records, /<Form .*action="\/admin\/groundwater"/);
assert.match(read("app/app/page.tsx"), /<Form .*action="\/app\/chat"/);
for (const path of ["app/app/app-navigation.tsx", "app/admin/admin-shell.tsx"]) {
  assert.match(read(path), /from "next\/link"/);
  assert.doesNotMatch(read(path), /window\.location|location\.href/);
}
const explorer = read("app/app/explorer/explorer.tsx");
assert.match(explorer, /useSearchParams/);
assert.match(explorer, /window\.history\.replaceState/);
assert.doesNotMatch(explorer, /router\.replace|router\.push/);
assert.match(explorer, /cancelled/);
assert.match(explorer, /assessmentResult\.key === assessmentKey/);
for (const path of ["app/app/dashboard-map.tsx", "app/app/analytics/analytics-map.tsx"]) {
  const source = read(path);
  assert.match(source, /dynamic\(\(\) => import\(/);
  assert.match(source, /ssr: false/);
  assert.match(source, /useDistrictBoundaries/);
  assert.match(source, /ref=\{frameRef\}/);
  assert.doesNotMatch(source, /from "(?:react-leaflet|leaflet)"/);
}
const hook = read("app/app/analytics/use-district-boundaries.ts");
assert.match(hook, /IntersectionObserver/);
assert.match(hook, /observer\?\.disconnect/);
assert.match(hook, /cancelled/);
assert.match(hook, /window\.location\.hash/);
assert.match(hook, /document\.getElementById\(anchor\)/);
assert.match(hook, /initialAnchors\?\.includes\(anchor\)/);
const boundarySource = read("app/app/analytics/district-boundaries.ts");
assert.match(boundarySource, /boundaries \?\?= fetch/);
assert.match(boundarySource, /boundaries = undefined/);
assert.doesNotMatch(boundarySource, /SUPABASE|AI_API_KEY|localStorage|sessionStorage/);
const leaflet = read("app/app/analytics/leaflet-map.tsx");
assert.match(leaflet, /layerRef\.current\?\.getBounds/);
assert.match(leaflet, /layer\.setStyle/);
assert.match(leaflet, /layer\.setTooltipContent/);
assert.doesNotMatch(leaflet, /key=|L\.geoJSON\(/);
assert.match(leaflet, /OpenStreetMap/);
assert.match(leaflet, /escapeHtml/);
assert.match(leaflet, /zoomAnimation=\{false\}/);
const chat = read("app/app/chat/chat-client.tsx");
assert.match(chat, /memo\(function AssistantMessage/);
assert.match(chat, /memo\(function UserMessage/);
assert.match(chat, /prefers-reduced-motion/);
assert.match(chat, /fetch\("\/api\/chat"/);
for (const path of ["app/auth/auth-form.tsx", "app/admin/login/admin-login-form.tsx", "app/admin/(protected)/groundwater/import/import-form.tsx"]) {
  assert.match(read(path), /submitLock\.current/);
  assert.match(read(path), /finally/);
}
assert.match(read("app/admin/(protected)/groundwater/[id]/record-form.tsx"), /useActionState/);
for (const path of ["app/app/loading.tsx", "app/app/explorer/loading.tsx", "app/app/analytics/loading.tsx", "app/app/chat/loading.tsx", "app/admin/(protected)/loading.tsx", "app/admin/(protected)/groundwater/loading.tsx", "app/admin/(protected)/groundwater/import/loading.tsx", "app/admin/(protected)/groundwater/[id]/loading.tsx"]) assert.ok(existsSync(resolve(root, path)), path);
for (const path of ["app/app/error.tsx", "app/admin/(protected)/error.tsx"]) {
  assert.match(read(path), /retry/);
  assert.doesNotMatch(read(path), /error\.message|console\./);
}
assert.match(read("app/page.tsx"), /<Suspense fallback=/);
assert.match(read("app/app/page.tsx"), /<Image .*sizes=.*preload/);
assert.doesNotMatch(read("app/globals.css"), /url\(['"]\/images\/maharashtra-water-landscape/);
assert.match(read("app/layout.tsx"), /next\/font\/google/);
assert.match(read("app/layout.tsx"), /Geist_Mono\(\{[\s\S]*?preload: false/);

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((item) => item.isDirectory() ? sourceFiles(resolve(directory, item.name)) : /\.(ts|tsx)$/.test(item.name) ? [resolve(directory, item.name)] : []);
}
function dependencies(file) {
  const tree = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  return tree.statements.filter(ts.isImportDeclaration).filter((node) => {
    const clause = node.importClause;
    if (clause?.isTypeOnly) return false;
    if (clause && !clause.name && clause.namedBindings && ts.isNamedImports(clause.namedBindings) && clause.namedBindings.elements.every((item) => item.isTypeOnly)) return false;
    return true;
  }).map((node) => node.moduleSpecifier.text);
}
const visited = new Set();
function inspectClientGraph(file) {
  if (visited.has(file)) return;
  visited.add(file);
  const source = readFileSync(file, "utf8");
  if (/^["']use server["'];/.test(source)) return; // Next Server Action reference, not implementation.
  assert.doesNotMatch(source, /import ["']server-only["']|SUPABASE_SERVICE_ROLE_KEY|AI_API_KEY|OPENROUTER_API_KEY|api\.openai\.com|openrouter\.ai/, `server boundary reached from client: ${file}`);
  assert.ok(!file.includes(".server."), `client imports a server module: ${file}`);
  for (const name of dependencies(file)) {
    assert.ok(!name.startsWith("csv-parse"), `CSV parser reached from client: ${file}`);
    if (!name.startsWith(".") && !name.startsWith("@/")) continue;
    const base = name.startsWith("@/") ? resolve(root, name.slice(2)) : resolve(dirname(file), name);
    if (extname(base) === ".css") continue;
    const target = [base, base + ".ts", base + ".tsx", resolve(base, "index.ts"), resolve(base, "index.tsx")].find((candidate) => existsSync(candidate) && /\.(ts|tsx)$/.test(candidate));
    assert.ok(target, `unresolved local client dependency ${name} in ${file}`);
    inspectClientGraph(target);
  }
}
const files = [...sourceFiles(resolve(root, "app")), ...sourceFiles(resolve(root, "lib"))];
for (const file of files) if (/^["']use client["'];/.test(readFileSync(file, "utf8"))) inspectClientGraph(file);
console.log(`Performance foundation structural validation passed: render-scoped auth, authorized parallel reads, URL/Link/Form navigation, map deferral and stable layers, loading/retry UI, form guards and ${visited.size} client-graph modules. This does not prove runtime performance.`);
