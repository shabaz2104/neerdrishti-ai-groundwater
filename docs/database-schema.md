# NeerDrishti Database Schema

## 1. Purpose

This schema is the initial PostgreSQL/Supabase structure for the structured
groundwater assessment data. It models the normalized dataset without
importing its 359 records. The migration is intentionally limited to one
assessment table; vector search, chat, analytics, administration, and lookup
tables are outside this ticket.

Migration:

`supabase/migrations/20260922152344_create_groundwater_schema.sql`

Administration and audit controls are added later by
`supabase/migrations/20261001120000_add_admin_authorization.sql`; see
`docs/admin-panel.md` for the role, RLS, and bootstrap model.

## 2. Table

The migration creates one table:

`public.groundwater_assessments`

It contains 24 normalized groundwater data columns, plus the generated `id`
and five source/lifecycle traceability columns (`source_year`,
`source_document`, `source_reference`, `created_at`, and `updated_at`), for 30
table columns in total.

No groundwater records are inserted by the migration.

## 3. Columns

| Column | PostgreSQL type | Nullable | Meaning |
|---|---|:---:|---|
| `id` | `uuid` | No | Generated row identifier. |
| `district` | `text` | No | District name from the normalized source. |
| `assessment_unit` | `text` | No | Source assessment-unit name; its exact block/taluka semantics remain uncertain. |
| `year` | `integer` | No | Assessment year; the current normalized dataset contains 2024. |
| `recharge` | `numeric` | No | Total annual groundwater recharge from the source `(Ham)` field. |
| `extraction` | `numeric` | No | Total groundwater extraction from the source `(Ham)` field. |
| `classification` | `text` | No | Normalized source classification. |
| `state_code` | `text` | No | Source state code (`MH` in the current dataset). |
| `district_code` | `text` | No | Source district code. |
| `assessment_unit_code` | `text` | No | Source district/block code, retained without reinterpreting its hierarchy. |
| `source_serial_number` | `integer` | No | Source serial number. |
| `total_geographical_area` | `numeric` | No | Source total geographical area value; unit is not specified in the local documentation. |
| `recharge_worthy_area` | `numeric` | No | Source recharge-worthy area value; unit is not specified in the local documentation. |
| `recharge_from_rainfall_monsoon` | `numeric` | No | Monsoon rainfall recharge component. |
| `recharge_from_other_sources_monsoon` | `numeric` | No | Monsoon recharge component from other sources. |
| `recharge_from_rainfall_non_monsoon` | `numeric` | No | Non-monsoon rainfall recharge component. |
| `recharge_from_other_sources_non_monsoon` | `numeric` | No | Non-monsoon recharge component from other sources. |
| `total_natural_discharges` | `numeric` | No | Total natural groundwater discharges from the source `(Ham)` field. |
| `annual_extractable_groundwater_resource` | `numeric` | No | Annual extractable groundwater resource from the source `(Ham)` field. |
| `irrigation_use` | `numeric` | No | Irrigation groundwater use from the source `(Ham)` field. |
| `industrial_use` | `numeric` | No | Industrial groundwater use from the source `(Ham)` field. |
| `domestic_use` | `numeric` | No | Domestic groundwater use from the source `(Ham)` field. |
| `annual_gw_allocation_for_domestic_use_as_on_2025` | `numeric` | No | Source annual domestic-use allocation field; the source wording is retained. |
| `net_groundwater_availability_for_future_use` | `numeric` | No | Net groundwater availability for future use from the source `(Ham)` field. |
| `stage_of_groundwater_extraction_percent` | `numeric` | Yes | Stage of groundwater extraction percentage; the source has one missing value. |
| `source_year` | `integer` | No | Year of the source dataset used for the row. |
| `source_document` | `text` | No | Source report or document name. |
| `source_reference` | `text` | No | Source table, annexure, or page reference. |
| `created_at` | `timestamptz` | No | Row creation timestamp, defaulting to the database time. |
| `updated_at` | `timestamptz` | No | Last-update timestamp, defaulting to the database time. The administration migration later maintains it with a trigger. |

The administration migration adds nullable `updated_by`, referencing
`auth.users(id)`, without changing the source/import provenance columns.

All measured values use PostgreSQL `numeric` rather than floating-point
types. No guessed unit or unit conversion is encoded in the schema.

## 4. Primary key and logical identity

The primary key is:

```sql
id uuid primary key default gen_random_uuid()
```

The validated logical key is enforced by a table-level unique constraint:

```text
(district, assessment_unit, year)
```

`assessment_unit` is not unique by itself. Ticket 9 found nine repeated
assessment-unit names across different districts. A district and assessment
unit together with the assessment year identify the current logical record.

## 5. Classification constraint

`classification` is `text` with a `CHECK` constraint allowing only the
normalized values currently observed in the dataset:

- `critical`
- `over_exploited`
- `safe`
- `salinity`
- `semi_critical`

`salinity` remains its own value. No additional categories or business rules
are introduced.

## 6. Nullability and missing values

The normalized CSV has no missing values in its identity, classification,
source-code, or other preserved data columns except
`stage_of_groundwater_extraction_percent`, which has one blank source value.
That column is therefore nullable. The schema does not use zero as a missing
value and does not fabricate a stage percentage.

The other normalized data columns are `NOT NULL` because they are populated
for every row in the validated source dataset. This reflects the current
dataset, not an instruction to fill missing values during future ingestion.

## 7. Source traceability

Each row has explicit source metadata:

- `source_year`
- `source_document`
- `source_reference`
- `created_at`
- `updated_at`

For the current dataset, the source document is the report identified in the
profile as `REPORT ON DYNAMIC GROUND WATER RESOURCES OF MAHARASHTRA 2024`,
and the source reference can identify the Annexure VI table and report pages.
The migration does not insert those values yet.

Keeping these fields on each assessment row is a simple traceability design
for the initial single-table schema. A separate dataset/import registry can
be introduced later if multiple source versions make that necessary.

## 8. Relationship to `docs/data-contract.md`

The schema directly represents the contract concepts `district`, `year`,
`recharge`, `extraction`, and `classification`. The source-faithful
`assessment_unit` column represents the contract's geographic unit concept
without asserting that it is definitively a block, taluka, or another
hierarchy level. It is deliberately not renamed to `block` because the
normalization documentation records that semantic uncertainty.

The source provides additional clearly defined fields, which are retained in
the table for later exploration and import. The contract's historical-record
concept is supported by the integer `year` field and by the logical key,
without fabricating years that are not present.

## 9. Unresolved units and semantics

- Recharge and extraction values are stored as `numeric`; the source labels
  the total fields with `(Ham)`, but the contract does not expand or define
  that unit. No conversion is performed.
- The area columns and recharge component columns retain their numeric source
  values, but their exact units are not specified in the local profile.
- `assessment_unit` is source-faithful. Its relationship to the contract's
  `block` concept remains uncertain.
- `assessment_unit_code` is retained as a source code; its hierarchy is not
  reinterpreted.
- The source field `annual_gw_allocation_for_domestic_use_as_on_2025` retains
  the source's `2025` wording. This schema does not infer a new business
  meaning from that wording.
- The official business interpretation of the observed classification
  vocabulary remains outside this ticket.

## 10. Row-level security

Row Level Security is enabled on `public.groundwater_assessments`.

The migration grants `SELECT` to `anon` and `authenticated` and creates one
policy allowing public read access for the planned explorer/chatbot:

```text
groundwater_assessments_public_read
```

There are no public `INSERT`, `UPDATE`, or `DELETE` policies. Anonymous users
therefore receive read-only access through the RLS policy; no service-role
credential is exposed, and no admin write policy is created in this ticket.

The later administration migration preserves public reads for the original
assessment/source columns but changes the grant to an explicit column list so
the new `updated_by` audit identity is not publicly selectable. It adds only a
narrow admin UPDATE policy; INSERT and DELETE remain unavailable.

## 11. Scope boundary

This ticket creates only the initial migration and schema documentation. It
does not import the 359 records, modify either CSV, create Supabase lookup or
vector tables, add chat history, build APIs or UI, or add dependencies.
