# NeerDrishti theme system

NeerDrishti supports two effective themes, `light` and `dark`, without changing
page structure or application behavior. The visual direction remains warm cream,
deep navy, groundwater blue and environmental green in light mode; dark mode uses
midnight navy pages, slate/navy surfaces, off-white text and muted blue/teal/green.

## Architecture and tokens

The root `<html>` element carries `data-theme="light"` or `data-theme="dark"`.
`app/globals.css` defines shared semantic tokens for page, surface, text, border,
accent, focus and form colors. Existing public (`--public-*`), protected
(`--nd-*`) and admin (`--admin-*`) tokens remain authoritative inside their
surfaces and receive scoped dark values. This avoids global color inversion and
does not alter Tailwind v4, server components, data values or layout geometry.

`app/theme-toggle.tsx` is the only toggle implementation. It appears in:

- the public landing header;
- the authentication form header;
- the protected application header;
- the administrator header; and
- the administrator login header.

The button displays the active sun/moon icon, exposes an action-specific accessible
label and `aria-pressed`, supports keyboard activation, and uses the global focus
ring. Mobile layouts reuse the same component.

## Persistence and system preference

Manual choice is stored under `localStorage["neerdrishti-theme"]`. A stored
`light` or `dark` value overrides the operating-system preference across refresh,
navigation, sign-in/sign-out and later tabs. When no valid value exists,
`prefers-color-scheme` selects the effective theme and live system changes are
followed. The browser `storage` event keeps open tabs aligned.

The root layout uses a small `beforeInteractive` initializer to apply the effective
theme before hydration and paint. It accesses browser APIs only inside that script;
server rendering does not read `window` or `localStorage`. The root suppresses only
the expected theme-attribute hydration difference. No security header was removed.
A future enforced CSP must nonce or hash this known inline initializer.

## Maps, charts and classifications

Groundwater and classification colors keep their existing meanings. Dark mode
changes only surrounding tints, text and borders. Dashboard/analytics charts use
dark tracks and readable labels while preserving values and segment colors.

Leaflet tiles and GeoJSON are unchanged. Dark mode styles the map container, zoom
controls, popup, tooltip and attribution chrome; it does not invert tiles, rewrite
geometry or alter map handlers.

## Accessibility and motion

Dark text/surface pairs use off-white primary text and muted high-contrast secondary
text. Inputs, native options, tables, messages, badges and focus indicators have
explicit dark states. Error, warning and success treatments remain distinct from
groundwater classification colors. Theme transitions are short, and existing
`prefers-reduced-motion: reduce` rules disable them.

## Validation and known limitations

`node scripts/validate-theme-system.mjs` checks pre-hydration setup, persistence,
system-preference handling (including all four stored/system precedence cases),
shared toggle placement, dark scope coverage, Leaflet chrome and reduced-motion
support. TypeScript, lint, build and existing product validators remain the
functional regression suite. Rendered-HTML smoke checks returned HTTP 200 for `/`,
`/auth` and `/admin/login`, with both the pre-hydration initializer and accessible
toggle label present.

Interactive browser verification was unavailable for the implementation run: the
isolated browser host could not be reached and the native browser surface returned
no readable capture. Light -> dark -> light interaction, refresh persistence,
route navigation, keyboard activation, browser-console hydration checks, map/chart
tooltips, authenticated routes and visual inspection at 390/768/1024/1440 therefore
remain manual checks. External map tile appearance also depends on OpenStreetMap
availability.
