# NeerDrishti production hardening

Date: 16 October 2026

This document records the final adversarial review of the current Maharashtra 2024 application. Structural checks and local test fixtures reduce risk; they do not replace deployment-specific penetration testing, Supabase policy inspection, secret management, monitoring, or a durable rate limiter.

## Threat model

The browser, URL parameters, Server Action arguments, CSV files, AI text, and stale UI state are untrusted. An authenticated user may invoke protected entry points directly, a former administrator may retain a valid session after role revocation, and external providers may fail or return malformed data. Authorization therefore comes from the current Supabase session plus database-backed role checks, and PostgreSQL RLS/grants remain the final mutation boundary.

## Findings and fixes

| Severity | Finding | Resolution |
| --- | --- | --- |
| Critical / high | Next.js 16.3.5 was covered by current production advisories, including RCE/SSRF classes reported by `npm audit`. | Updated Next.js and its ESLint config to 16.4.2. |
| Moderate | `csv-parse` 6.x was covered by a prototype-replacement advisory. | Updated to 7.0.3 and reran all adversarial CSV fixtures. |
| High | `source-map-js` 1.2.1 had an event-loop denial-of-service advisory. | Pinned the transitive dependency to 1.2.2 with an npm override. |
| High | The chat route validated JSON shape but did not cap a chunked request body before buffering it. | Added a 64 KiB byte ceiling, strict JSON content type, UTF-8 decoding, early stream cancellation, and existing 2,000-character/four-history-item validation. |
| Medium | Protected Explorer Server Actions relied on the page layout for authentication. | Each action now verifies the current server session before any query. |
| Medium | Admin editing accepted years outside the product's 2024 data contract and extremely large finite numbers. | Admin UI/action and PostgreSQL now require 2024 and bound non-negative measurements. |
| Medium | CSV validation accepted negative and extremely large finite groundwater values. | Parser and database RPC validation now reject them; zero remains valid and nullable stage remains nullable. |
| Low | Rapid chat and sign-out invocation could race before React rendered the pending state. | Added synchronous request locks while retaining disabled/pending UI. |
| Low | Duplicate/extreme query parameters and out-of-range admin pages needed explicit normalization. A very large page could reach PostgREST before the redirect and trigger the safe error boundary. | Duplicate values are reduced deterministically, filter lengths/characters are bounded, invalid filters return no data, and the record manager now counts first, bounds its database range, then redirects beyond-final requests to the final valid page. |
| Low | The narrow admin records view exposed both the intended table scrollbar and an unintended page-level horizontal scrollbar. | The admin shell now contains horizontal overflow while preserving the table's own scroll region. |
| Low | Root not-found and error experiences used framework defaults. | Added safe, non-diagnostic root boundaries. |
| Low | Conservative browser security headers were absent. | Added `nosniff`, strict-origin referrer policy, denied framing, and a restrictive permissions policy. |

## Authentication, sessions, and RBAC

- `/app` remains protected optimistically by the Supabase proxy and authoritatively by the app layout's verified `getUser()` result.
- Every admin page that reads data and every admin mutation calls `requireAdmin()` independently. Hidden UI is never treated as authorization.
- Record update, CSV preview, and CSV import recheck the current role. `public.is_admin()` reads `public.user_roles` on each database statement. The React `cache()` helpers are render/request scoped and contain no TTL or process-global role map.
- A disposable PostgreSQL test removed an administrator role while retaining that user's session identity; the next preview and update affected no privileged data. No logout/login was required.
- The auth callback always redirects to fixed same-origin paths. No user-controlled `next`, `redirect`, or `returnTo` destination is accepted.
- Sign-in, admin sign-in, chat, CSV validation/import, record save, and sign-out retain pending-state guards; mutation safety still depends on server reauthorization and database constraints.

Expired/invalid sessions and cross-tab sign-out are safe by architecture: the next Server Component, Server Action, or chat request verifies the session again. A stale page cannot authorize a protected mutation. Deployment testing should still repeat cross-tab revocation against the production Supabase project.

## PostgreSQL grants and RLS

- Anonymous and authenticated users have intended column-scoped `SELECT` access to groundwater records. `updated_by` is excluded from that grant.
- Anonymous users have no groundwater insert/update/delete grant or policy.
- Normal authenticated users have no effective insert/update/delete access: insert/update policies require `is_admin()`, and delete remains unavailable to every application role.
- `user_roles` permits authenticated users to read only their own role row; it grants no self-escalation insert/update path.
- `dataset_imports` has no anonymous grant. Authenticated reads/inserts require current admin status, and inserted `uploaded_by` must equal `auth.uid()`.
- Admin insert and column-scoped update remain approved operations. Protected identifiers, provenance, timestamps, and `updated_by` are not mass-assignable.
- The hardening migration adds a database check for Maharashtra (`MH`), year/source year 2024, a positive source serial, non-negative bounded measurements, and nullable stage.

The database tests used a disposable in-memory PostgreSQL runtime. They attempted anonymous insert/update, normal-user insert/update, normal-user role escalation, normal-user import RPC calls, protected-column update, delete, and post-revocation admin calls. No hosted dataset row was changed.

## Admin edit protections

- The action builds an explicit allowlist; it never spreads arbitrary browser input into `.update()`.
- `id`, source codes, source serial metadata, source provenance, creation/update timestamps, and administrator UUID are read-only.
- District/unit text is trimmed, length-bounded, and rejects control characters.
- Year is exactly 2024; classification is one of five approved values.
- Required measurements reject blanks, non-decimal forms, scientific notation, `NaN`, infinity, negatives, excessive length, and values above the supported bound. Numeric zero remains valid. Stage may be blank/null or zero.
- The logical-key precheck provides a readable duplicate message; the unique database constraint handles races safely.
- The action compares `updated_at` before saving and includes it in the update predicate. A stale second editor affects no row and receives a refresh/review message.
- Invalid IDs and missing records produce not-found or safe action messages without database details.

## CSV protections

The contract remains UTF-8 `.csv`, at most 512 KiB, at most 1,000 rows, exactly 24 expected headers, state `MH`, year 2024, and the five approved classifications. Parsing uses `csv-parse`, not comma splitting. Tests cover empty/header-only files, wrong/missing/duplicate/extra headers, BOM, quoted commas/newlines/quotes, CRLF/LF, malformed quotes, NUL, long records/names, path-like filenames, invalid UTF-8, oversize/1,001 rows, duplicate logical keys, invalid classes, blank/zero/negative/extreme numerics, `NaN`, infinity, scientific notation, wrong year, and wrong state.

Preview classifies `NEW`, `UNCHANGED`, and `CONFLICT`; confirmation reparses the uploaded bytes, recomputes SHA-256, and revalidates in PostgreSQL. Browser preview JSON never becomes a database row. `ON CONFLICT DO NOTHING` prevents replacement, and the single PostgreSQL function transaction commits groundwater inserts and audit metadata together or rolls both back. Imported records use `Administrator CSV upload (unverified source)` provenance; uploads cannot claim official CGWB provenance.

## AI security and abuse boundaries

- `/api/chat` requires a verified user before reading the body.
- The route accepts only JSON, at most 64 KiB, one non-empty question up to 2,000 characters, and at most four equally bounded recent user questions. Unknown fields and assistant-authored history are rejected.
- Only closed, validated intent schemas and approved read-only groundwater tools are executable. The model has no SQL, shell, auth, role, credential, network-tool, or arbitrary URL capability.
- Provider modules and the service-role query layer are `server-only`. AI and service-role keys are neither `NEXT_PUBLIC` nor serialized, logged, included in provider request bodies, or emitted in `Server-Timing`.
- Hosted calls use fixed HTTPS endpoints: OpenAI Responses with `store: false`, or OpenRouter chat completions. Both have output-token ceilings, abort timeouts, and one bounded retry for transient failures. Production Ollama URLs must be HTTPS and non-private.
- Existing deterministic paths, strict structured-intent validation, fresh approved queries, safe provider errors, and grounded fallback remain unchanged. Tests cover offline/timeout/401/403/429/5xx, malformed/refused/truncated output, invalid intent, formatter failure, and secret-bearing provider errors.
- Injection requests to reveal instructions/keys, invent data, execute SQL, change roles, or call tools cannot create those capabilities. Automated adversarial prompts verify that these attempts produce no approved factual tool result and expose no secret/SQL-like output; intent grounding may still consult the read-only location directory. Unsupported years, predictions, rainfall/live-water requests, other states, unknown/ambiguous locations, nonsense, and empty input return clarification, unsupported, or safe-unavailable behavior rather than extrapolation.

No durable server-side rate limiter was added. An in-memory counter would be unreliable across serverless instances. Before a paid public deployment, enforce per-account/IP quotas at a durable edge/API gateway or shared store, retain Supabase authentication, and monitor provider cost/429 rates.

## Input, errors, links, and resources

- Query functions bound district and assessment-unit lengths and reject control characters. Supabase builder equality filters are used for district/unit/year/classification. The one admin OR search accepts only a short allowlisted character set, excluding PostgREST control punctuation and wildcards.
- Duplicate URL parameters are reduced to the first value. Invalid years/classes/search syntax produce no broadened privileged result. Admin pages are clamped and redirected safely.
- User-facing errors contain no SQL, Postgres/Supabase/provider bodies, stack traces, filesystem paths, JWTs, or secrets. The only application console event is development-only aggregate groundwater timing; it contains no question or credential.
- No application `target="_blank"` link exists. GeoJSON is fixed to `/maps/maharashtra-districts.geojson`; map tiles are fixed to OpenStreetMap. No user URL reaches server-side fetch.
- `.env.local`, `.next`, TypeScript build metadata, and all `.env*` files except the empty `.env.example` template are ignored.
- Admin actions and import RPCs never write `data/raw`, `data/processed`, or the official PDF.

## HTTP headers and CSP decision

All routes receive:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`
- `X-Frame-Options: DENY`

A strict CSP was deliberately not guessed in this pass. Next.js runtime scripts, development behavior, Leaflet CSS/assets, and OpenStreetMap image tiles need a nonce/hash- and environment-aware policy. Deploy CSP first in report-only mode on the real hosting origin, capture violations, then enforce a tested policy. HSTS should likewise be set by the HTTPS deployment platform after domain/subdomain ownership is confirmed.

## Dependency and secret audits

`npm audit --omit=dev` reports zero production vulnerabilities after the Next.js, CSV parser, and source-map updates. The full audit reports five high-severity development-only advisories in the ESLint/fast-glob/micromatch chain. Npm suggests an incompatible Next ESLint downgrade, so no force fix was applied. Keep the lint toolchain local/CI-only and revisit when a compatible upstream release resolves them.

The source scan found only explicit test sentinels in validator scripts. It found no embedded application credential, private JWT, service-role value, AI key, hardcoded administrator password, or leaked `.env.local`. No credential rotation is required from this audit.

## Automated and manual coverage

Automated checks include TypeScript, ESLint, production build, whitespace, all existing auth/query/Explorer/Analytics/map/Chat/AI/provider/conversation/Admin/CSV/performance validators, the new structural hardening validator, client-bundle secret scanning, dependency audits, CSV adversarial fixtures, and disposable PostgreSQL grant/RLS/transaction tests. The structural validator explicitly does not claim penetration-test coverage.

Browser checks cover logged-out redirects, fixed response headers, unknown routes, an authenticated administrator's app/admin navigation, filter and extreme-page normalization, null-stage rendering (`Not available`), map lazy loading/selection, safe error layouts, visible keyboard focus, and responsive widths around 390/768/1024/1440 px. Mutation success and normal-user/admin-denial tests are intentionally limited to disposable fixtures; no hosted groundwater record, role, or import audit row is changed.

## Remaining deployment recommendations

1. Apply `20261016120000_production_hardening.sql` through the controlled Supabase migration process before production approval, then inspect effective grants/policies in the target project.
2. Test normal-user/admin identities, live role revocation, token expiry, cross-tab sign-out, stale concurrent edits, failed network recovery, and CSV confirmation in a staging project with disposable records.
3. Add durable hosted-AI quotas/rate limits and cost/latency/error monitoring before exposing paid AI broadly.
4. Run CSP in report-only mode, then enforce it after testing Next.js and OpenStreetMap across production/staging origins.
5. Validate TLS, HSTS, cookie settings, backup/restore, audit retention, log redaction, alerting, and Supabase key rotation procedures on the deployment platform.
6. Repeat accessibility, layout, and slow-network testing on real low-end devices. Automated/local browser results are not Core Web Vitals guarantees.

## Readiness assessment

The repository is ready for staging after the new migration is applied. Production approval remains conditional on deployment-level migration verification, durable AI abuse controls, staging identity/session tests, and platform security configuration. No source credential was found and no credential rotation is currently required.
