# NeerDrishti Command Center

## Dashboard sections

The authenticated `/app` page is now a server-rendered Command Center inside
the existing application shell. It contains:

- A hero section introducing NeerDrishti as an AI Groundwater Insight System.
- Live KPI cards for districts, assessment units, groundwater records, and
  assessment year.
- A five-class classification distribution overview.
- A compact 2024 assessment-coverage panel.
- Three next-step feature cards linking to Explorer, Analytics, and AI Chatbot.

Analytics and AI Chatbot remain explicitly marked as future destinations. No
fake charts, responses, maps, or derived risk scores were added.

## Data sources and KPI definitions

The dashboard uses the existing controlled server-side query layer only:

- `getDistricts()` → unique district KPI.
- `getAssessmentUnits()` → unique assessment-unit KPI.
- `getClassificationSummary(2024)` → record total, assessment year, and all
  five classification counts.

The KPI values therefore come from the current Supabase dataset: 36 districts,
350 assessment units, 359 records, and assessment year 2024. The dashboard
does not send the full record set to the browser or calculate the summary from
client-side data.

## Classification summary

The classification section presents `critical`, `over_exploited`, `safe`,
`salinity`, and `semi_critical` with human-readable labels, record counts, and
percentages. A lightweight CSS bar breakdown is used instead of adding a chart
dependency. Counts and text labels remain visible, so classification is not
communicated by color alone and no category is ranked as better or worse.

If the summary query is empty, the dashboard shows an explicit empty state. If
any summary query fails, affected values show an em dash and a generic retry
message rather than misleading zeroes or database details. The route-level
`app/app/loading.tsx` provides a skeleton while server data is loading.

## Linked routes

- `Explore Groundwater` → `/app/explorer`
- `View Analytics` → `/app/analytics` (placeholder)
- `Ask the AI Assistant` → `/app/chat` (placeholder)

The existing `/app` authentication layout and proxy protection remain in
place. Manual browser verification with a real account is still recommended
for visual review at desktop, tablet, and mobile widths.
