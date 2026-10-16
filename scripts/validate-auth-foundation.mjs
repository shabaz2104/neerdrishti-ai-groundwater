import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  const absolutePath = resolve(root, relativePath);
  assert.ok(existsSync(absolutePath), `missing auth file: ${relativePath}`);
  return readFileSync(absolutePath, "utf8");
}

const browserClient = read("lib/supabase/client.ts");
const authForm = read("app/auth/auth-form.tsx");
const signOutButton = read("app/app/sign-out-button.tsx");
const serverClient = read("lib/supabase/server.ts");
const proxy = read("lib/supabase/proxy.ts");
const protectedLayout = read("app/app/layout.tsx");
const callback = read("app/auth/callback/route.ts");
const envExample = read(".env.example");

assert.match(browserClient, /createBrowserClient/);
assert.match(authForm, /signInWithPassword/);
assert.match(authForm, /signUp/);
assert.match(authForm, /emailRedirectTo/);
assert.match(signOutButton, /auth\.signOut/);
assert.match(serverClient, /createServerClient/);
assert.match(serverClient, /cookies/);
assert.match(proxy, /getClaims/);
assert.match(protectedLayout, /getCurrentUser/);
assert.match(protectedLayout, /redirect\("\/auth"\)/);
assert.match(callback, /exchangeCodeForSession/);
assert.doesNotMatch(envExample, /SUPABASE_SERVICE_ROLE_KEY/);

for (const [name, source] of [
  ["browser client", browserClient],
  ["auth form", authForm],
  ["sign-out button", signOutButton],
]) {
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|service_role/i, `${name} references a service-role credential`);
  assert.doesNotMatch(source, /console\.(log|error|warn)/, `${name} logs authentication data`);
}

console.log("Authentication foundation static validation passed.");
console.log("  browser/server boundary, auth flows, callback, and secret checks: passed");
