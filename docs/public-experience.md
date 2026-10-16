# Public landing and authentication experience

Ticket 23 gives `/` and `/auth` the same visual language as the protected NeerDrishti dashboard without changing the protected screens or authentication services.

## Landing page

The page has a restrained brand/header, an editorial landscape hero, a 2024 dataset coverage strip, four capability cards, a plain-language data section, audience descriptions, a small AI Assistant introduction, a final action and a quiet footer. The hero and calls to action lead to the existing `/auth` flow; “Get started” opens `/auth?mode=signup`. “Learn about the data” scrolls to the data section. AI is presented as one capability, not the product identity.

The coverage strip obtains district count from `getDistricts()` and unique assessment-unit-name and record counts from `getOverallSummary(2024)`. The verified dataset has 36 districts, 350 unique assessment-unit names and 359 records. Values become an em dash if the query fails; they are not replaced with invented counters. The year 2024 is the documented assessment year, not a live year range. “Unique unit names” is deliberate: the same name can occur in more than one district. Volumes in the app use hectare-metres (ha-m); the landing page explains the unit but does not append it to counts. The page does not imply live water readings or forecasts.

## Auth layout and behavior

The existing `/auth` route renders a split landscape/editorial panel and form on desktop, then a compact landscape banner followed immediately by the form on narrow screens. `/auth?mode=signup` initializes the existing sign-up form; the inline mode switch remains. Email, password, confirmation, generic errors, Supabase `signInWithPassword` / `signUp`, `emailRedirectTo`, confirmation state, and `/app` redirect behavior are retained. Callback errors are displayed as errors rather than success notices. The protected `/app` layout still owns access control.

## Visual and accessibility details

Public CSS is scoped to `.public-site` and `.auth-site`; it uses the dashboard’s navy, groundwater blue, environmental green, cream, borders, compact surfaces, Geist sans and DM Serif Display. Both hero treatments reuse `public/images/maharashtra-water-landscape.webp` with `next/image`; the image is decorative, so it has an empty alternative. Breakpoints support desktop, tablet and narrow mobile layouts. Form controls retain visible labels and focus styles; status/error messages retain their live-region roles. No new animation or UI dependencies were added.
