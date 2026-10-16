# NeerDrishti Application Shell

## Structure

The authenticated application is grouped under `/app` and uses
`app/app/layout.tsx` as its shared server-rendered boundary. The layout calls
the existing `getCurrentUser()` helper, redirects unauthenticated requests to
`/auth`, and wraps authenticated content in `AppShell`.

`AppShell` provides the branded header, signed-in email, sign-out action,
responsive navigation, and a consistent content area. `AppNavigation` owns
the active navigation state and the mobile menu. The existing
`SignOutButton` remains the single sign-out control.

## Routes

- `/app` — authenticated dashboard landing page
- `/app/explorer` — Groundwater Explorer placeholder
- `/app/analytics` — Analytics placeholder
- `/app/chat` — AI Chatbot placeholder

The existing root `proxy.ts` still protects `/app*` using the Supabase session
claims check. The authenticated layout performs the server-side user check as
the final protection. Each placeholder uses the same shell and contains no
fake charts, groundwater results, or chatbot responses.

The dashboard status cards query the existing server-side groundwater query
layer for the current 2024 record, assessment-unit, and district counts. No
second data source or duplicate dataset was added.

## Responsive and accessibility behavior

Desktop and tablet widths use a left navigation rail. Smaller widths use a
keyboard-accessible disclosure button for the application menu. Navigation
links expose the active section with `aria-current="page"`; controls use
semantic buttons, links, labels, and headings with visible focus styles from
the existing Tailwind setup.

## Verification

TypeScript, lint, and production build checks verify all four routes compile
and are included in the Next.js route output. Static inspection confirms the
existing auth callback, proxy protection, server user check, and sign-out
control remain in place.

Manual browser verification is still recommended at desktop and mobile widths
with a real Supabase account: visit each route while signed out, sign in, move
between sections, open the mobile menu, and sign out. No test credentials were
created, and no browser automation was available in this environment.
