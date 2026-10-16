# Groundwater Analytics

## Architecture and data flow

The protected `/app/analytics` route is a server-rendered analytics dashboard
inside the existing application shell. It calls the controlled query layer
directly on the server; the browser receives only the summary values and top
extraction rows needed to render the page.

Queries used:

- `getClassificationSummary(2024)` for classification counts and record total.
- `getOverallSummary(2024)` for aggregate resource fields.
- `getDistricts()` for the district KPI.
- `getAssessmentUnits()` for the assessment-unit KPI.
- `getTopExtractionAreas(2024, 10)` for the extraction table.
- `getDistrictComparison(2024)` for the interactive map and top-10 district
  comparison. It returns one server-aggregated row per district, not raw
  assessment records.

The analytics query extensions aggregate the existing stored source fields
across the requested year without changing the schema, RLS, importer, or data
model.

## Metrics and classification counts

The verified 2024 metrics are:

- 359 records
- 36 districts
- 350 unique assessment units
- Assessment year 2024

Classification counts are displayed for all five normalized values:

| Source classification | Records |
|---|---:|
| `critical` | 7 |
| `over_exploited` | 8 |
| `safe` | 302 |
| `salinity` | 1 |
| `semi_critical` | 41 |
| **Total** | **359** |

The horizontal bar visualization shows counts and correctly calculated
percentages. It does not rank classes or create a risk score. Text labels and
numbers remain visible so color is not the only communication channel.

## Resource overview

The dashboard aggregates these stored fields for 2024:

- `recharge`
- `annual_extractable_groundwater_resource`
- `extraction`
- `net_groundwater_availability_for_future_use`

Each card names its source field. The source resource fields are displayed in
hectare-metres (`ha-m`), retaining the stored numeric values without changing
the database. For volume context only, `1 ha-m = 10,000 m³ = 10 million
litres`; the UI does not turn that conversion into a new availability formula.

## Extraction table

The table uses `getTopExtractionAreas(2024, 10)`, whose deterministic ordering
is descending stored extraction followed by district, assessment unit, and
year tie-breakers. Desktop uses a semantic table with a caption and scoped
headers; mobile uses stacked cards to avoid horizontal scrolling. The table is
explicitly described as extraction-based ordering, not risk ranking.

## Loading, errors, and limitations

Dedicated route loading UI prevents misleading zeroes while server queries are
pending. Query failures show generic retry messages and unavailable values as
em dashes; raw Supabase errors and credentials are never exposed. Empty
classification or extraction results have explicit empty states.

Only the 2024 assessment is available in the current dataset, so the page uses
a `2024 Assessment` indicator rather than inventing historical year options.
The Explorer remains the route for inspecting individual records. The map
uses the official BharatMap district layer as a static WGS 84 / EPSG:4326
asset; source, retrieval, explicit legacy-name mappings, attribution, and
limitations are documented in `docs/maharashtra-district-map.md`.
