# Groundwater Explorer

## Architecture

`/app/explorer` is a protected server-rendered route inside the existing
authenticated application shell. The route loads the unique district list
with `getDistricts()` and passes only that list into the client Explorer.

The client component does not access Supabase directly and does not import the
service-role query layer. Its Server Actions call the existing controlled
functions instead:

- `getDistricts()` for the initial district selector.
- `getAssessmentUnits(district)` after a district is selected.
- `getAssessment(district, assessmentUnit, year)` after all filters are set.

No raw SQL or second database-access implementation was added. The browser
never downloads the full assessment table.

## Filters and URL state

The available filters are district, assessment unit, and year. The district
list is loaded from Supabase and currently contains 36 names. Assessment units
are fetched only for the selected district, and changing districts clears the
previous unit and assessment before loading the new list. The only available
year is currently `2024`; the year control is represented as a list so future
years can be added without changing the filter layout.

Selections are preserved in the URL with `district`, `assessmentUnit`, and
`year` query parameters, for example:

```text
/app/explorer?district=Pune&assessmentUnit=Example&year=2024
```

Invalid or unavailable URL values fall back to the safe default selection
state. No state-management dependency was introduced.

## Result and state handling

The result view displays district, assessment unit, year, the source
classification, stage of groundwater extraction, annual groundwater recharge,
annual extractable groundwater resource, annual groundwater extraction, and
net annual groundwater availability.

Classification values remain the normalized source values (`critical`,
`over_exploited`, `safe`, `salinity`, and `semi_critical`) while the badge uses
readable labels. A missing stage percentage displays `Not available`; it is
never replaced with zero or calculated from another field. Metric values are
shown as stored values without inventing or converting units. This follows the
current data contract, whose source-unit interpretation remains unresolved.

Loading, empty, and error states cover the district list, district-scoped unit
list, and individual assessment. Query errors are converted to user-facing
messages without exposing SQL, credentials, stack traces, or Supabase internals.

## Responsive and manual verification

The Explorer uses the existing shell and responsive Tailwind layout. Labels,
native selects, focus styles, status/alert regions, and touch-sized controls
support keyboard and mobile use.

Run the focused validation with:

```text
node --env-file=.env.local scripts/validate-groundwater-explorer.mjs
```

TypeScript, lint, build, and an unauthenticated `/app/explorer` redirect smoke
test are automated locally. Manual browser verification remains recommended
for selecting a district/unit, checking the URL state, observing the loading
states, and confirming the known null stage value displays as `Not available`.
