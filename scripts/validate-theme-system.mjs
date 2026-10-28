import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const layout = read("app/layout.tsx");
const toggle = read("app/theme-toggle.tsx");
const globalCss = read("app/globals.css");
const publicCss = read("app/public-experience.css");
const protectedCss = read("app/app/protected-visual.css");
const adminCss = read("app/admin/admin.css");

assert.match(layout, /suppressHydrationWarning/);
assert.match(layout, /strategy="beforeInteractive"/);
assert.match(layout, /neerdrishti-theme/);
assert.match(layout, /document\.documentElement\.dataset\.theme/);

const initializer = layout.match(/\{`\(\(\)=>\{([\s\S]*?)\}\)\(\)`\}/)?.[1];
assert.ok(initializer, "root theme initializer must remain directly testable");

function initializedTheme(saved, systemDark, storageThrows = false) {
  const document = { documentElement: { dataset: {}, style: {} } };
  const localStorage = {
    getItem() {
      if (storageThrows) throw new Error("storage unavailable");
      return saved;
    },
  };
  runInNewContext(`(()=>{${initializer}})()`, {
    document,
    localStorage,
    matchMedia: () => ({ matches: systemDark }),
  });
  assert.equal(document.documentElement.style.colorScheme, document.documentElement.dataset.theme);
  return document.documentElement.dataset.theme;
}

assert.equal(initializedTheme(null, false), "light");
assert.equal(initializedTheme(null, true), "dark");
assert.equal(initializedTheme("light", true), "light");
assert.equal(initializedTheme("dark", false), "dark");
assert.equal(initializedTheme("invalid", true), "dark");
assert.equal(initializedTheme(null, true, true), "dark");
assert.match(toggle, /^"use client";/);
assert.match(toggle, /localStorage\.getItem\(THEME_STORAGE_KEY\)/);
assert.match(toggle, /localStorage\.setItem\(THEME_STORAGE_KEY, next\)/);
assert.match(toggle, /prefers-color-scheme: dark/);
assert.match(toggle, /addEventListener\("change", onSystemChange\)/);
assert.match(toggle, /addEventListener\("storage", onStorage\)/);
assert.match(toggle, /aria-pressed/);
assert.match(toggle, /Switch to light mode/);
assert.match(toggle, /Switch to dark mode/);
assert.doesNotMatch(toggle, /supabase|AI_PROVIDER|OPENROUTER|server-only/i);

for (const path of [
  "app/page.tsx",
  "app/auth/auth-form.tsx",
  "app/app/app-shell.tsx",
  "app/admin/admin-shell.tsx",
  "app/admin/login/admin-login-form.tsx",
]) {
  const source = read(path);
  assert.match(source, /ThemeToggle/, `${path} must expose the shared toggle`);
}

assert.match(globalCss, /:root\[data-theme="dark"\]/);
assert.match(globalCss, /--page-background:/);
assert.match(globalCss, /--surface-background:/);
assert.match(globalCss, /--text-primary:/);
assert.match(globalCss, /\.leaflet-popup-content-wrapper/);
assert.match(globalCss, /prefers-reduced-motion: reduce/);
assert.match(publicCss, /data-theme="dark".*\.public-site/s);
assert.match(publicCss, /data-theme="dark".*\.auth-site/s);
assert.match(protectedCss, /data-theme="dark".*\.nd-page/s);
assert.match(protectedCss, /nd-classification-over-exploited/);
assert.match(adminCss, /data-theme="dark".*\.admin-site/s);
assert.match(adminCss, /data-theme="dark".*\.admin-login/s);

console.log("Theme system validation passed: executable storage/system precedence, pre-hydration initialization, persistent shared toggle, public/auth/app/admin placement, scoped dark surfaces, classification semantics, Leaflet chrome and reduced-motion support.");
