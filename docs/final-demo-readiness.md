# NeerDrishti final demo readiness

Assessment date: 28 October 2026  
Presentation date: 29 October 2026  
Verdict: **NOT READY** until the configured Supabase project is restored or the
application is pointed at the intended active project.

## Project summary

NeerDrishti presents Maharashtra's verified 2024 groundwater assessment through
a public introduction, authenticated dashboard, Explorer, analytics and map,
a grounded AI assistant, and an administrator-only record and CSV workflow.
The application is Next.js 16.4.2 with React, TypeScript, Supabase, Leaflet and
server-only Ollama, OpenAI or OpenRouter model transports.

## Verified data facts

- Assessment year: 2024 only.
- Records: 359.
- Districts: 36.
- Unique assessment-unit names: 350.
- Volume unit: hectare-metres (ha-m).
- Classifications: Safe, Semi Critical, Critical, Over Exploited and Salinity.
- Source: CGWB Maharashtra 2024 assessment report.
- The product does not provide live sensors, rainfall, forecasts or a 2015-2024
  time series.

These facts are verified in the normalized source and prior database validation.
On 28 October, current live database revalidation was blocked by DNS failure.

## System architecture

Public and authenticated pages use the existing server query layer. Authentication
and sessions use Supabase Auth. Administrative actions independently re-check the
current user and admin role, while database RLS and column grants remain the final
authorization boundary.

Chat follows this fixed flow:

`/api/chat -> deterministic resolver or structured planner -> strict intent parser
-> eight-action allowlist -> approved Supabase query -> grounded answer or
deterministic fallback`

Models receive neither database credentials nor arbitrary SQL/tool capability.

## Actual deployment status

- No Git remote is configured.
- No local `.vercel` project link or deployed URL was found.
- The production build passes, but this does not mean the application is deployed.
- The configured Supabase host uses the requested project ref
  `wpslyhjcoccpidftiqqv`, but DNS returned NXDOMAIN on 28 October 2026.
- Remote migration status could not be checked. Do not apply migrations until the
  project identity is confirmed in the Supabase dashboard.

## QA results

### Passed

- `npx tsc --noEmit`.
- ESLint.
- Next.js production build and route generation.
- `git diff --check` before changes.
- Authentication boundary structural validator.
- Maharashtra GeoJSON validator: 36 unique districts.
- Chat UI validator.
- AI engine structural validator; Ollama live smoke was skipped because Ollama was
  not reachable.
- AI provider validator with mocked Ollama/OpenAI/OpenRouter HTTP.
- Admin panel structural validator.
- Admin CSV parser/action validator using isolated adapters and no live writes.
- Performance-foundation and production-hardening validators.
- Logged-out HTTP route denial for `/app`, Explorer, Analytics, Chat, Admin,
  record management and CSV import.
- Public landing, authentication pages, local image optimizer, source image,
  GeoJSON, 404 and invalid callback HTTP smoke checks.
- Security headers on public/auth responses.
- Post-build client bundles contain no exact Supabase service-role key, OpenRouter
  key, server-only key names or OpenRouter endpoint.

### Blocked or failed

- Query-layer, Explorer, Analytics and AI conversation validators returned the
  application's safe `DATABASE_ERROR` because the Supabase hostname did not
  resolve.
- Live sign-in, sign-up, session refresh, two-tab sign-out, normal/admin role
  journeys, protected data pages and safe database mutations were blocked by the
  same external dependency.
- Interactive browser control stopped at the Windows safety boundary, and isolated
  headless Opera did not produce screenshots. Pixel-level 390/768/1024/1440 visual
  inspection is therefore not marked PASS.
- No deployed URL exists to test.

## Performance findings

Development server startup completed in approximately 1 second. The built
production server became ready on a separate port in approximately 0.4 seconds.

Logged-out HTTP measurements on a warm development server:

| Route | Result | Observed total |
| --- | --- | ---: |
| `/` first measured request | 200 | 9.28 s |
| `/` repeated request | 200 | 7.33 s |
| `/auth` warm request | 200 | about 0.12-0.17 s |
| `/app` logged out | 307 to `/auth` | about 0.01-0.04 s |
| Admin protected routes logged out | 307 to `/admin/login` | about 0.21-0.29 s |

The repeated landing request reported roughly 7 ms in `proxy.ts`; the remaining
7.2 seconds was application code waiting for failed Supabase coverage queries.
The historical 26.5-second proxy and 22.2-second protected-route delays were not
reproduced for logged-out traffic. Authenticated timing remains unverified.
No destination-stream error appeared during the measured requests.

## AI and OpenRouter readiness

The local environment selects `openrouter` with `openrouter/free` for intent and
answer stages. The key is server-only and was never displayed.

Exactly two live planner requests were made:

1. Adapter request: HTTP completed but was rejected as `AI_MALFORMED_RESPONSE`
   after about 6.4 seconds.
2. Diagnostic request: HTTP 200, `finish_reason=stop`, and valid strict
   `getTopExtractionAreas` JSON after about 13.8 seconds.

The adapter now retries one malformed OpenRouter intent once while retaining the
same whole-document JSON parsing, strict intent schema and action allowlist. No
post-fix live request was made because the two-request QA limit had been reached.
Answer-stage malformed output is not retried; deterministic grounded formatting
remains the fallback after a successful data query.

OpenAI was not called. Ollama was not running. OpenRouter quota and selected free
model availability remain external variables.

## Fixed bugs and cleanup

- Added one bounded retry for a malformed OpenRouter planner response without
  relaxing validation.
- Replaced the inaccurate Chat label `Local model` with provider-neutral grounded
  AI wording.
- Updated the stale scaffold-only README and documented the server-only Supabase
  service-role variable.
- Removed a tracked zero-byte migration with a malformed timestamp that duplicated
  the real admin-authorization migration name. The four real migrations and schema
  are unchanged.

## Known limitations and blockers

1. **P0:** Supabase project ref `wpslyhjcoccpidftiqqv` currently returns NXDOMAIN.
   Authenticated product areas cannot be demonstrated until this is fixed.
2. **P1:** Remote application of
   `20261015120000_add_admin_csv_import.sql` and
   `20261016120000_production_hardening.sql` is unverified.
3. **P1:** No deployment or production origin is configured.
4. **P1:** OpenRouter free-router intent reliability was one valid response out of
   two before the bounded retry fix; the fix has mock coverage but no remaining
   live-test allowance.
5. Authenticated browser, role-revocation, admin mutation and successful NEW CSV
   import checks require active isolated accounts and a disposable database.
6. Durable distributed AI rate limiting and deployment CSP/HSTS remain deployment
   responsibilities documented in `production-hardening.md`.

## Demo sequence

Do not begin the normal live demo until the P0 Supabase check below passes.

1. Open `/` and explain the 2024 source and ha-m units.
2. Sign in with the normal demo account.
3. Show Dashboard counts: 36 districts, 350 unique unit names, 359 records, 2024.
4. Open Explorer and select a known district/unit.
5. Open Analytics and the district map.
6. Ask `is mumbai in critcal zone or safe zone` (deterministic fast path).
7. Ask `Which assessment units in Pune have the highest extraction?` (planner).
8. Ask `Tell me about Indapur.` followed by `What is its extraction?`.
9. Ask `Predict Pune groundwater in 2030.` and show the unsupported response.
10. On the presenter's admin account, show the record manager and CSV preview only;
    do not import NEW rows into official data.

Safe alternate path if OpenRouter is unavailable: use the Mumbai deterministic
classification question and supported focused metric questions. These still need
Supabase. Do not claim they work offline.

## Examiner device checklist

- Use a current desktop browser at 100% zoom for the primary presentation.
- Confirm 390, 768, 1024 and 1440 pixel layouts manually after Supabase recovery.
- Confirm the mobile menu, fixed Chat composer visibility, map controls, chart
  legends/tooltips and admin table horizontal scrolling.
- Use a 1024-1440 pixel projector output and verify classification colors remain
  distinguishable.
- Keep browser zoom/pan defaults and test Back/Forward before the session.
- Disable password-manager overlays and unrelated browser notifications.

Responsive CSS breakpoints, contained admin table overflow, reduced-motion rules
and mobile navigation passed structural inspection; visual rendering remains a
manual check.

## Demo backup strategy

### Before presentation

1. In the Supabase dashboard, confirm project ref `wpslyhjcoccpidftiqqv` exists,
   is active and exposes the expected project URL. If it was deleted, identify the
   intended replacement project before changing local/deployment environment values.
2. Confirm the four real migrations are applied in order; inspect migration history
   rather than blindly pushing.
3. Run the query-layer and conversation validators again.
4. Sign in once as normal user and once as admin; verify role denial with a normal
   account.
5. Run one manual OpenRouter planner question only after quota/status checks.
6. If using Vercel, deploy only after environment and callback URLs are configured,
   then smoke-test the actual HTTPS origin.

### During presentation

- If OpenRouter returns 429/unavailable, explain that deterministic grounded Chat
  requests and deterministic answer formatting do not require a planner response.
- If Ollama is installed and tested, `AI_PROVIDER=ollama` is an honest local model
  alternative; Ollama was not reachable during this QA.
- If Supabase is slow, wait for the readable unavailable state and move to source
  documentation/architecture. The application is not offline because all current
  authoritative data and auth are cloud-backed.
- If the hosted app is unavailable, run the tested production build locally, but
  only after confirming the local machine can resolve Supabase.
- Never replace unavailable results with fabricated statistics or perform a live
  production CSV insert for demonstration.

## Environment requirements

Required for data/auth:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

OpenRouter demo configuration:

- `AI_PROVIDER=openrouter`
- `OPENROUTER_API_KEY` (server-only)
- `OPENROUTER_INTENT_MODEL=openrouter/free`
- `OPENROUTER_ANSWER_MODEL=openrouter/free`

Also configure the exact local and deployed `/auth/callback` origins in Supabase.
Never prefix privileged keys with `NEXT_PUBLIC_`.

## Unverified external dependencies

- Supabase project availability, migration history, user/admin accounts, RLS on the
  remote project, backup/restore and audit retention.
- Vercel/deployed origin, TLS, callback allowlist, HSTS and deployment CSP.
- OpenRouter free-model selection, quota and rate limits after the two live tests.
- OpenStreetMap tile delivery on the examiner's network.
- Ollama model installation and local reachability.

