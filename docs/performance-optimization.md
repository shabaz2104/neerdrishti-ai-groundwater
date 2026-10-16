# Navigation and whole-app performance (Ticket 28)

## Scope and measurement method

Canonical repository: `C:\coding projects\neerdrishti-final`. No commit made.
This is performance/navigation work, not a redesign. Groundwater query logic,
schema, data, units, NULL handling, ranking, AI/provider semantics, permissions,
RLS and CSV transaction contracts remain unchanged. `.env.local` was not edited.

Baseline measurements were collected before behavioral edits using the existing
production build, then repeated with `next build` / `next start` on localhost:3107.
HTTP measurements use Node fetch; header time approximates response availability
including proxy/route work, not pure server-render CPU time or browser FCP.
Three-sample timings are illustrative, not controlled benchmarks or an SLA.
Supabase/network/cache contention can change results.

The user signed in personally in the browser. Signed-in click-to-heading samples
use wall-clock time around browser automation and include tool/locator overhead.
They are not Core Web Vitals, network traces or statistically significant results.
The browser interface exposes rendered DOM and screenshots, not its Performance
or Network APIs; backend duplicate-call counts were not traced live.

## Baseline observations

- Landing awaited both coverage queries before sending its hero/header.
  Header samples: **598.6, 503.8, 497.8 ms**, median **503.8 ms**.
  Complete-response samples: 604.4, 505.0, 498.9 ms.
- Public/auth routes and server components already use Next Link. Dashboard,
  Analytics and admin overview already run independent reads in `Promise.all`
  (five, six and three reads respectively); these were not newly parallelized.
- Admin layouts call `getAdminAccess`, while protected child data helpers/import
  pages call it again through `requireAdmin`. Each previously created another
  cookie-backed client, verified the user and queried `user_roles` in one render.
- Admin Records fetched its district filter list only after the records query.
- Unauthenticated admin overview rendering could start three public summary
  queries concurrently with the layout's authorization redirect. Baseline `/admin`
  complete-response samples without cookies: **843, 353, 209 ms**, status 307.
- Explorer used both Server Actions and `router.replace` for every filter change.
  The latter refreshed the route/district list and could change an effect dependency,
  causing extra work despite the existing action already loading the selected data.
- Both maps independently fetched and parsed the same **6,621,471-byte** GeoJSON
  (**1,340,467 bytes gzip**), containing **372,062 vertices** and 36 districts.
  Leaflet was already dynamically imported with `ssr: false`, but maps loaded
  immediately even below the fold. Selection/metric keys remounted the full
  geometry, and fitting bounds constructed an additional `L.geoJSON` layer.
- Charts are CSS/server-rendered charts, not a heavy chart-library dependency.
- Chat re-rendered every existing Markdown answer when the composer text changed.
- Public imagery already used `next/image`; Dashboard's hero was a CSS background.
  Original WebP: **163,390 bytes**. All fonts already use build-time `next/font`.
- App routes had loading UI; protected admin routes did not. App lacked a page
  error boundary. Admin's reset callback did not re-fetch failed contents; the
  installed Next 16.3.5 docs recommend the now-stable `retry` callback.

## Changes

### Navigation and loading

Retain the existing server AppShell/AdminShell layouts and semantic Next Links.
Their shared layout persistence remains framework-managed. Priority links remain
eligible for Next's automatic, loading-boundary-aware prefetching; no forced full
prefetch of every page or custom prefetch timers were added.

Dashboard's question form and Admin Records' GET filter form now use `next/form`
for client navigation and progressive enhancement. Search parameters and normal
history entries are preserved. Admin filters remount their control wrapper when
server URL parameters change so back/forward navigation restores defaults.
Existing Map/comparison and Dashboard About/Help hash links are honored again
after their streamed sections mount; normal Analytics navigation stays at the
top with its map deferred. Only those known section IDs are handled.
Individual record-edit/pagination links and query-specific dashboard prompt chips
have `prefetch={false}` to avoid bursts of unused authenticated work. Record links
remain semantic, keyboard-accessible Links, not click-only elements.

Explorer uses Next's native-history integration: `replaceState` updates the same
URL/history entry without a redundant RSC navigation, and `useSearchParams` is the
source of truth on initial load and back/forward. Server Actions still fetch the
district's units and the selected assessment. The unit must be resolved first;
these dependent reads are intentionally not parallelized. Results are keyed to
their district/filter selection, with obsolete async responses ignored. No new
cross-navigation groundwater answer cache was introduced.

The landing header/hero/static content now stream immediately while a Suspense
coverage component runs the same two independent queries. The fallback reserves
the same four-card layout, displays dashes rather than invented counts, and
announces loading accessibly.

Added restrained admin overview/records/import/editor loading boundaries, retaining
the shell while server work proceeds. Added a safe App page error boundary and
changed Admin retry to the installed Next version's re-fetching `retry` callback.
Exceptions are never displayed or logged in these components.

### Auth deduplication and query waterfalls

`createClient`, verified `getCurrentUserResult`, and `getAdminAccess` use React
`cache` for **one server render only**. This deduplicates identical verification
and role lookups shared by layouts/pages/helpers. There is no `unstable_cache`,
`use cache`, global user map, persisted auth state or time-based role cache.
Proxy refresh/claims verification remains independent and unchanged; it is not
replaced by trusting browser-provided identity. Separate requests, login/logout,
and future role checks do not inherit another render's result. React cache outside
an RSC render is not treated as a persistent Route Handler/Server Action cache.

Every mutation still calls `requireAdmin`. Records explicitly authorizes first,
then runs records and district-filter reads concurrently; the data helper still
checks authorization too, sharing only that render's verification. Admin Overview
now authorizes before starting public summary reads, avoiding unnecessary reads
for denied visitors without changing access rules.

The main groundwater query module is untouched. Overlapping summary/count/map
reads were not fused or persistently cached: their projections, ordering,
partial-error behavior and freshness after admin corrections are preserved.

### Maps, client work, images and fonts

Both map wrappers observe their existing reserved frame, starting boundary loading
within 200 px of visibility. Leaflet remains client-only and dynamically isolated;
an offscreen mobile/Analytics map does not mount it prematurely. Older browsers
without IntersectionObserver load normally. Observer/effect cleanup prevents
updates after unmount or obsolete callbacks.

A shared Promise fetches/parses **only the public static boundary asset once per
document**. Concurrent mounts and Dashboard → Analytics navigation share it.
Failure clears the Promise so a later mount can retry. No authentication,
measurements, user data or Leaflet instances are cached. Full geometry and source
properties are unchanged; no simplification or asset replacement was performed.

The GeoJSON layer remains mounted when metric/selection changes. Only its styles,
tooltips and event handlers update. Bounds come from the existing layer, not a
second 372k-vertex construction; changing selection does not reset zoom. Hover
handlers use current metric/selection values and are cleaned up before replacement.
Tooltip escaping, attribution, controls and district interactions are retained.
Number formatting reuses one formatter rather than rebuilding it per tooltip.
The signed-in zoom-then-navigate test exposed a Leaflet 1.9 delayed zoom-animation
callback running after map removal (`_leaflet_pos`). Public `zoomAnimation: false`
now makes zoom immediate, avoids that timer race and reduces transition work for
the full-resolution geometry. No Leaflet private methods were patched.

Chat memoizes only stable user/assistant message leaves, avoiding repeated
Markdown parsing on each composer keystroke. Requests, history, grounding,
metadata and providers are unchanged. Scrolling respects reduced-motion settings.
No fake streaming or speculative AI calls were added.

Auth/admin login and CSV client controls have synchronous in-flight submission
guards plus their existing pending feedback, released in `finally`. Admin editing
retains React `useActionState` and its existing pending/stale-edit protections.
No authentication, import, validation, or transaction semantics changed.

Dashboard uses the existing landscape through a responsive `next/image` with
reserved hero dimensions and the same gradients/crop positions. Public/auth image
use remains intact. Serif/sans/mono fonts stay self-hosted via `next/font`, with the
unused mono preload disabled (the face itself remains available). No typography
or visual asset was replaced. CSS changes are limited to image layering, stable
admin skeletons, contained table overflow and reduced-motion scrolling.

## Boundary and bundle review

The structural validator follows runtime local imports from all client entry
points, skips erased type imports and stops at Next Server Action references.
It rejects server-only modules, provider URLs/config, service-role settings or
CSV parser implementations reaching a client graph. It currently inspects 25
client-graph modules. This is a structural guard, not a benchmark.

Built client chunks were scanned for OpenAI endpoint/key/model identifiers,
Supabase service-role identifiers, `csv-parse` and the admin import RPC name; none
were found. Server Actions remain references, not shipped implementations.
Maps receive 36 aggregates, Explorer receives its narrow selected-assessment
projection, and Admin keeps 25-row pagination. Charts remain server-rendered.
No virtualization, chart dependency, bundle-analyzer dependency or full database
payload was added. No claim is made that total JavaScript bytes decreased: small
hooks/loading/guard code was added to avoid larger runtime work.

## Measured results

First optimized production run, header samples: **300.3, 30.0, 24.1 ms**, median
**30.0 ms**, versus baseline median 503.8 ms. Complete-response samples were
1,188.8, 500.1, 213.0 ms: data still waits for Supabase; only earlier availability
of the static page is established. All responses were 200 with hero and real
coverage content in the completed body.

Unauthenticated `/admin` samples after authorization gating: **25, 21, 14 ms**,
status 307. Public `/auth` samples: 50, 24, 13 ms (baseline 61, 27, 12 ms);
`/admin/login`: 28, 25, 28 ms (baseline 27, 19, 15 ms). No login-page speedup is
claimed. Protected `/app` routes remain redirects without a valid session.

Signed-in single-sample navigation results are recorded below.
The baseline table deliberately includes tool overhead and should not be compared
with the HTTP header numbers above.

| Interaction | Before (ms) | After (ms) |
| --- | ---: | ---: |
| Dashboard → Explorer heading | 1,569 | 718 |
| District Pune → unit Indapur visible | 936 | 516 |
| Explorer → Analytics heading | 917 | 638 |
| Analytics → Chat heading | 683 | 437 |
| Admin Overview → Records heading | 1,656 | 633 |
| Records → Import heading | 630 | 1,043 |
| Records → Edit heading | 963 | 703 |

Repeated Home → Explorer → Home → Explorer measured **718 → 677 ms** in
the optimized build. The second navigation did not worsen. Import's sample was
slower; no across-the-board navigation speedup is claimed. These small samples
do not isolate prefetch state, network variance or individual optimization effects.

Boundary-loader fixture checks (no live network) confirm concurrent/repeated calls
use one fetch, and rejected requests can retry. Layer-construction reductions
(two constructions → one on mount; remount → style updates on selection) are code
inspection findings, not measured frame-time or memory improvements.

## Validation and remaining checks

Run:

```text
node scripts/validate-performance-foundation.mjs
node scripts/validate-auth-foundation.mjs
node --env-file=.env.local scripts/validate-groundwater-query-layer.mjs
node --env-file=.env.local scripts/validate-groundwater-explorer.mjs
node --env-file=.env.local scripts/validate-analytics.mjs
node scripts/validate-maharashtra-map.mjs
node scripts/validate-chat-ui.mjs
node scripts/validate-ai-provider.mjs
node --env-file=.env.local scripts/validate-ai-engine.mjs
node --env-file=.env.local scripts/validate-ai-conversation.mjs
node scripts/validate-admin-panel.mjs
node --env-file=.env.local scripts/validate-admin-csv-import.mjs
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Performance validation is explicitly structural only. AI provider HTTP remains
mocked; no paid hosted calls are needed. Ollama was offline and was not started:
AI inference/provider logic is not changed by this ticket. The conversation
validator still passes with real Supabase data and forced formatter failures.

Signed-in browser checks passed for Dashboard/Explorer/Analytics/Chat navigation,
repeated Home/Explorer navigation, Explorer history restoring Pune/Indapur, admin
filters restoring on Back, 25-row pagination, Import and editor navigation without
mutations, and a deterministic Mumbai Chat answer with its source/year metadata.
Pune filtering returned 14 records; Back restored all 25 first-page rows.

An offscreen Analytics map had zero SVG district paths with its frame 1,972 px
below the top in an 844 px viewport. After scrolling into view it rendered 36
district paths; Pune selection and metric/zoom controls worked. After the zoom
fix, zooming and immediately navigating away produced no new console errors.
Map and comparison hash links reached their headings at approximately y=0 after
the route streamed; the Help link reached its visible footer section.

Layouts were inspected at 390 px and 768 px. The mobile menu and keyboard Link
navigation worked; the tablet header/main/page bounds stayed within the viewport.
The admin table remained independently scrollable: a horizontal gesture moved
its scrollLeft to 412 while the document's scrollLeft stayed 0. The landscape and
boundary source assets retain their exact original sizes; no data asset was edited.
The streamed landing placeholder resolved to the real 36/350/359/2024 coverage
values, and Sign in with the existing session returned to Dashboard.

Verification images (local Codex output, not replacement app assets):

- [390 px dashboard](C:/Users/Lenovo/.codex/visualizations/2026/09/22/01a0c879-8b02-7450-80ec-29e172227cf9/ticket-28-mobile-dashboard.jpg)
- [768 px dashboard](C:/Users/Lenovo/.codex/visualizations/2026/09/22/01a0c879-8b02-7450-80ec-29e172227cf9/ticket-28-tablet-dashboard.jpg)

TypeScript, lint, production build, structural performance/auth/admin/CSV/Chat/map
checks, query/Explorer/Analytics validators, provider fixtures, AI engine checks
and the real-data conversation validator passed. Client bundle boundary scanning
passed. Final Git whitespace/status checks were run; unrelated existing changes
were preserved. The temporary browser tab and production test server were closed.

Do not infer
CLS/LCP/INP scores, backend request traces or mutation correctness from screenshots
or this structural validator. Real failed-network recovery, reduced-motion OS
settings, two simultaneous users/role revocation, slow mobile hardware/network,
successful/failed auth submissions and mutation double-clicks should still be
checked in a dedicated test environment. No real record edit, CSV import or new
account creation was performed for this performance ticket.

## File manifest

Created:

- `app/app/analytics/district-boundaries.ts`
- `app/app/analytics/use-district-boundaries.ts`
- `app/app/error.tsx`
- `app/admin/admin-form-loading.tsx`
- `app/admin/(protected)/loading.tsx`
- `app/admin/(protected)/groundwater/loading.tsx`
- `app/admin/(protected)/groundwater/import/loading.tsx`
- `app/admin/(protected)/groundwater/[id]/loading.tsx`
- `scripts/validate-performance-foundation.mjs`
- `docs/performance-optimization.md`

Updated:

- `lib/auth.server.ts`, `lib/admin-auth.server.ts`, `lib/supabase/server.ts`
- `app/page.tsx`, `app/layout.tsx`, `app/globals.css`
- `app/auth/auth-form.tsx`, `app/admin/login/admin-login-form.tsx`
- `app/app/page.tsx`, `app/app/dashboard-map.tsx`
- `app/app/explorer/page.tsx`, `app/app/explorer/explorer.tsx`
- `app/app/analytics/analytics-map.tsx`, `app/app/analytics/leaflet-map.tsx`
- `app/app/chat/chat-client.tsx`
- `app/admin/(protected)/page.tsx`, `app/admin/(protected)/error.tsx`
- `app/admin/(protected)/groundwater/page.tsx`
- `app/admin/(protected)/groundwater/import/import-form.tsx`
- `app/admin/admin.css`
