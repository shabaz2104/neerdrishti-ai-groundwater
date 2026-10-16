# 2024 Groundwater Dataset Normalization

## Scope

This document records the normalization of the source-faithful CSV
`data/processed/groundwater_2024_assessment_units_raw.csv` into
`data/processed/groundwater_2024_normalized.csv`.

Only column names, the assessment-year field, and the explicitly requested
classification formatting variant were normalized. The raw CSV was not
modified, rows were not discarded, and no values were fabricated or unit
converted.

## Result summary

| Check | Result |
|---|---:|
| Source records represented | 359 |
| Normalized columns | 24 |
| Distinct districts | 36 |
| Distinct assessment-unit names | 350 |
| Normalized classification values | `critical`, `over_exploited`, `safe`, `salinity`, `semi_critical` |
| Complete duplicate rows | 0 |
| Duplicate logical keys (`district + assessment_unit + year`) | 0 |
| Dataset year values | `2024` only |
| Missing normalized values | 1, in `stage_of_groundwater_extraction_percent` |

The one missing value is the source blank for record 29 (`Daryapur`,
Amravati). It remains blank in the normalized CSV. No missing value was
converted to zero.

## Source-to-canonical column mapping

All source columns are retained as canonical snake_case columns. The
canonical application-facing fields are placed first; source identifiers and
the additional groundwater measurements follow them.

| Source column | Canonical column | Detected/source meaning | Transformation performed | Unit |
|---|---|---|---|---|
| `District` | `district` | District name | Renamed only | Not applicable |
| `Assessment Unit Name` | `assessment_unit` | Source assessment-unit/taluka-wise name | Renamed only; repeated names remain separate records | Not applicable |
| Not present in source CSV | `year` | Assessment year from dataset/report identity | Set to `2024` for every source record | Calendar year |
| `Total Annual Ground Water Recharge (Ham)` | `recharge` | Total annual groundwater recharge | Renamed only; source numeric text preserved | `Ham`, as stated by source |
| `Total Extraction (Ham)` | `extraction` | Total groundwater extraction | Renamed only; source numeric text preserved | `Ham`, as stated by source |
| `Categorization (OE/Critical/Semi critical/Safe)` | `classification` | Source groundwater categorization | `semi critical` normalized to `semi_critical`; all other observed values preserved | Category label |
| `State code` | `state_code` | State code | Renamed only | Code |
| `State District Code` | `district_code` | State district code | Renamed only; source semantics not reinterpreted | Code |
| `State District Block Code` | `assessment_unit_code` | State district/block code | Renamed only; source hierarchy not reinterpreted | Code |
| `Sl. No` | `source_serial_number` | Source row serial number | Renamed only | Integer-like source value |
| `Total Geographical Area` | `total_geographical_area` | Total geographical area | Renamed only; no unit conversion | Source unit not specified in CSV/profile |
| `Recharge Worthy Area` | `recharge_worthy_area` | Recharge-worthy area | Renamed only; no unit conversion | Source unit not specified in CSV/profile |
| `Recharge from Rainfall-Monsoon` | `recharge_from_rainfall_monsoon` | Monsoon rainfall recharge component | Renamed only; source numeric text preserved | Source unit not explicitly restated; source field context is groundwater-resource data |
| `Recharge from Other Sources-Monsoon` | `recharge_from_other_sources_monsoon` | Monsoon recharge from other sources | Renamed only; source numeric text preserved | Source unit not explicitly restated |
| `Recharge from Rainfall-Non-Monsoon` | `recharge_from_rainfall_non_monsoon` | Non-monsoon rainfall recharge component | Renamed only; source numeric text preserved | Source unit not explicitly restated |
| `Recharge from Other Sources-Non-Monsoon` | `recharge_from_other_sources_non_monsoon` | Non-monsoon recharge from other sources | Renamed only; source numeric text preserved | Source unit not explicitly restated |
| `Total Natural Discharges (Ham)` | `total_natural_discharges` | Total natural groundwater discharges | Renamed only; source numeric text preserved | `Ham`, as stated by source |
| `Annual Extractable Ground Water Resource (Ham)` | `annual_extractable_groundwater_resource` | Annual extractable groundwater resource | Renamed only; source numeric text preserved | `Ham`, as stated by source |
| `Irrigation Use (Ham)` | `irrigation_use` | Irrigation groundwater use | Renamed only; source numeric text preserved | `Ham`, as stated by source |
| `Industrial Use (Ham)` | `industrial_use` | Industrial groundwater use | Renamed only; source numeric text preserved | `Ham`, as stated by source |
| `Domestic Use (Ham)` | `domestic_use` | Domestic groundwater use | Renamed only; source numeric text preserved | `Ham`, as stated by source |
| `Annual GW Allocation for Domestic Use as on 2025 (Ham)` | `annual_gw_allocation_for_domestic_use_as_on_2025` | Annual domestic-use groundwater allocation | Renamed only; the source wording, including `2025`, is retained | `Ham`, as stated by source |
| `Net Ground Water Availability for future use (Ham)` | `net_groundwater_availability_for_future_use` | Net groundwater availability for future use | Renamed only; source numeric text preserved | `Ham`, as stated by source |
| `Stage of Ground Water Extraction (%)` | `stage_of_groundwater_extraction_percent` | Stage of groundwater extraction | Renamed only; blank source value remains blank | Percent |

## Normalization decisions

### Year

The source CSV has no year column. Because the profile identifies it as the
2024 assessment dataset, `year` is populated as the integer-like text value
`2024` for all 359 records. No records for other years were created.

### Assessment units and duplicates

`Assessment Unit Name` is preserved as `assessment_unit`. The normalized data
does not treat this name as globally unique. The nine repeated names occur in
different districts (`Akola`, `Ashti`, `Jalgaon`, `Kalamb`, `Karanja`,
`Karjat`, `Khed`, `Malegaon`, and `Nandgaon`), so each source record remains
present. There are no duplicate `district + assessment_unit + year` keys.

The source unit is not renamed to `block` because the profile says the report
uses block/mandal/taluk terminology and the exact hierarchy is not certain.
`assessment_unit` is therefore the traceable canonical field for the
contract's geographic unit concept; a separate, potentially misleading
`block` alias was not invented.

### Classification

Only the explicit formatting variant `semi critical` was changed to
`semi_critical`. The normalized counts are:

| Classification | Count |
|---|---:|
| `safe` | 302 |
| `semi_critical` | 41 |
| `critical` | 7 |
| `over_exploited` | 8 |
| `salinity` | 1 |

No additional classification category was introduced.

### Numeric values and missing values

Numeric source text was carried through without rounding or unit conversion.
Fields with `(Ham)` retain the source unit label `Ham`; the source profile
does not provide a more expanded unit description. The area columns retain
their source values and their unit remains unspecified in the local profile.

The only missing normalized field is
`stage_of_groundwater_extraction_percent`, with one blank value. All other
normalized columns are populated for all 359 records. Blank CSV fields are
used for missing values.

## Comparison with `docs/data-contract.md`

### Satisfied or directly represented

- `district` is directly represented from `District`.
- The source assessment unit is directly represented as `assessment_unit`.
- `year` is represented as `2024`, derived from the documented dataset year.
- `recharge` is directly represented by total annual recharge in `Ham`.
- `extraction` is directly represented by total extraction in `Ham`.
- `classification` is directly represented using the observed source
  vocabulary, with only the requested `semi critical` formatting variant
  normalized.
- Missing measurements remain missing rather than being filled.
- Additional source measurements and provenance-oriented codes are retained.

### Meaning or unit limitations that remain

- The contract calls the geographic unit `block`, while the source column is
  `Assessment Unit Name`; its exact block/taluka/assessment-unit semantics
  remain uncertain.
- The source profile explicitly labels the recharge and extraction totals as
  `Ham`, but the contract does not define or expand that unit.
- The source profile does not specify the units for the two area columns or
  the recharge component columns beyond the source table context.
- The source field mentioning domestic allocation “as on 2025” is retained
  verbatim in its canonical name; this ticket does not reinterpret that
  source wording.
- The classification values are source-observed categories. Their official
  taxonomy or business interpretation remains outside this normalization
  ticket.

### Source fields not currently required by the contract

`state_code`, `district_code`, `assessment_unit_code`,
`source_serial_number`, `total_geographical_area`, `recharge_worthy_area`,
the four recharge components, `total_natural_discharges`,
`annual_extractable_groundwater_resource`, `irrigation_use`,
`industrial_use`, `domestic_use`,
`annual_gw_allocation_for_domestic_use_as_on_2025`,
`net_groundwater_availability_for_future_use`, and
`stage_of_groundwater_extraction_percent` are preserved because they are
clearly defined source fields, but they are not required by the current
minimal contract.

## Validation performed

Validation was run against the written normalized CSV and the raw CSV. It
checked file existence, row and column counts, missing values, complete-row
duplicates, logical-key duplicates, distinct districts and assessment units,
classification values, numeric parsing, and year values.

Observed results:

- normalized file exists; raw file exists
- 359 normalized data rows and 24 columns
- 36 districts and 350 assessment-unit names
- one missing value, only in `stage_of_groundwater_extraction_percent`
- zero complete-row duplicates
- zero duplicate logical keys
- numeric parsing errors: zero
- year values: only `2024`
- raw CSV SHA-256 at validation: `D8FD131B18841217472A2FC4CA0F4038EE3FE666B9D6DD6255723DD2F06FEA8E`

The raw file was only read during this ticket and remained unchanged; its
validation hash is recorded above for traceability.

No SQL, database, RAG/vector, chatbot, UI, or dependency changes were made
for this ticket.
