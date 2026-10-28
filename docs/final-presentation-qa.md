# Final presentation QA matrix

Assessment date: 28 October 2026. `PASS` means the stated check was actually run.
`BLOCKED` means a required external dependency prevented completion. Structural or
mock coverage is noted but does not turn a live check into PASS.

| Area | Status | Evidence / remaining check |
| --- | --- | --- |
| Landing | PASS | HTTP 200, core copy, unavailable-data state, local image source and optimized image verified. Full stream took about 7.3 s while Supabase DNS failed. Pixel-level viewport review not completed. |
| Auth | BLOCKED | Auth UI/callback/static boundary checks pass; live sign-in, sign-up, invalid credentials, refresh and two-tab sign-out require the unavailable Supabase host. |
| Dashboard | BLOCKED | Logged-out denial and structural checks pass. Live 36/350/359 values cannot load while Supabase is NXDOMAIN. |
| Explorer | BLOCKED | Validator reached the real query layer and returned safe `DATABASE_ERROR`; URL/null controls have structural regression coverage. |
| Analytics | BLOCKED | Structural validator and code checks exist; real statistics could not be revalidated against the unavailable database. |
| Map | BLOCKED | GeoJSON passed with 36 unique districts and the 6.6 MB asset served successfully. Authenticated Leaflet interaction/tile delivery was not browser-tested. |
| Chat Fast Path | BLOCKED | Mocked engine/provider tests cover the Mumbai typo query and strict grounding. Live authoritative data query is blocked by Supabase. |
| Chat Planner | BLOCKED | OpenRouter credentials work; one live response was malformed and one was valid. A bounded malformed-intent retry was added and mock-tested, but no post-fix live allowance remained. Supabase is also unavailable. |
| Chat Follow-Up | BLOCKED | Mock/source regression covers Indapur context and fresh queries; live conversation validator is blocked by Supabase. |
| Admin | BLOCKED | Structural authorization/RLS/stale-update checks pass. Live normal/admin accounts, revocation and mutation rollback were not available. |
| CSV Import | BLOCKED | Isolated parser/action suite passes all contract and non-overwrite cases. Live preview/audit/NEW transaction requires active admin auth and a disposable database. |
| Mobile | NOT TESTED | Responsive CSS, mobile navigation, reduced motion and table overflow passed structural inspection. Windows browser automation stopped safely and headless Opera produced no screenshots. |
| Deployment | FAIL | No Git remote, `.vercel` link or deployed URL. Supabase DNS and remote migrations are unresolved. |
| Security | PASS | Hardening validator, server-only boundaries, safe redirects/headers, logged-out route denial, authenticated Chat architecture, request/history limits and admin re-authorization passed structural/HTTP checks. Deployment penetration/RLS inspection remains external. |

## Release gate

Change the overall verdict from **NOT READY** only after all of these are complete:

1. `wpslyhjcoccpidftiqqv.supabase.co` resolves and the intended project identity is
   confirmed.
2. Query-layer, Explorer, Analytics and AI conversation validators pass against
   the restored project.
3. Normal-user and admin browser journeys pass with isolated accounts.
4. Remote migration history includes the CSV and production-hardening migrations.
5. The actual presentation origin (local or deployed) passes 390/768/1024/1440
   visual checks and the exact demo transitions.
6. One final manual OpenRouter planner request succeeds, or the presenter commits
   to the deterministic-only Chat fallback for the demo.

