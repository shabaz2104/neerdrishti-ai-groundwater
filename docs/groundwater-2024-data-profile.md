# 2024 Groundwater Dataset Profile

## 1. Dataset identity

- Filename: `data/processed/groundwater_2024_assessment_units_raw.csv`
- Source report: `REPORT ON DYNAMIC GROUND WATER RESOURCES OF MAHARASHTRA 2024`
- Assessment year: 2024
- Source table: `ASSESSMENT OF DYNAMIC GROUND WATER RESOURCES OF MAHARASHTRA TALUKA WISE 2024`, Annexure VI
- Source PDF pages: 96-99; printed report pages 81-84
- Rows: 359
- Columns: 23
- Source-faithful status: This profile describes the extracted CSV without modifying it. No normalization, unit conversion, filling, deduplication, or category merging was performed.

## 2. Column inventory

Detected types are based on the actual CSV values. Numeric fields were parsed only for profiling; the CSV text values were not changed.

| # | Column name | Detected type | Non-null count | Null count | Unique count | Example values |
|---:|---|---|---:|---:|---:|---|
| 1 | `Sl. No` | integer-like numeric | 359 | 0 | 359 | `1`, `2`, `3` |
| 2 | `State code` | categorical/text | 359 | 0 | 1 | `MH` |
| 3 | `State District Code` | categorical/code | 359 | 0 | 36 | `MH01`, `MH02`, `MH03` |
| 4 | `State District Block Code` | categorical/code | 359 | 0 | 359 | `MH010100`, `MH010200`, `MH010300` |
| 5 | `District` | categorical/text | 359 | 0 | 36 | `Ahmednagar` |
| 6 | `Assessment Unit Name` | categorical/text | 359 | 0 | 350 | `Akola`, `Jamkhed`, `Karjat` |
| 7 | `Total Geographical Area` | numeric | 359 | 0 | 359 | `123350`, `68603`, `139398` |
| 8 | `Recharge Worthy Area` | numeric | 359 | 0 | 359 | `123350`, `68603`, `139398` |
| 9 | `Recharge from Rainfall-Monsoon` | numeric | 359 | 0 | 358 | `5177`, `4420.3`, `7782.1` |
| 10 | `Recharge from Other Sources-Monsoon` | numeric | 359 | 0 | 349 | `596.7`, `387.8`, `1022` |
| 11 | `Recharge from Rainfall-Non-Monsoon` | numeric | 359 | 0 | 237 | `780.3`, `684.9`, `1567.9` |
| 12 | `Recharge from Other Sources-Non-Monsoon` | numeric | 359 | 0 | 358 | `2235.7`, `1095.7`, `2659.7` |
| 13 | `Total Annual Ground Water Recharge (Ham)` | numeric | 359 | 0 | 359 | `8789.8`, `6588.8`, `13031.6` |
| 14 | `Total Natural Discharges (Ham)` | numeric | 359 | 0 | 351 | `439.5`, `329.4`, `651.6` |
| 15 | `Annual Extractable Ground Water Resource (Ham)` | numeric | 359 | 0 | 359 | `8350.3`, `6259.4`, `12380` |
| 16 | `Irrigation Use (Ham)` | numeric | 359 | 0 | 355 | `5994.7`, `3591.1`, `7176.8` |
| 17 | `Industrial Use (Ham)` | numeric | 359 | 0 | 103 | `0` |
| 18 | `Domestic Use (Ham)` | numeric | 359 | 0 | 347 | `649.5`, `286.9`, `241.9` |
| 19 | `Total Extraction (Ham)` | numeric | 359 | 0 | 359 | `6644.2`, `3878`, `7418.7` |
| 20 | `Annual GW Allocation for Domestic Use as on 2025 (Ham)` | numeric | 359 | 0 | 349 | `649.5`, `286.9`, `241.9` |
| 21 | `Net Ground Water Availability for future use (Ham)` | numeric | 359 | 0 | 359 | `2367.6`, `2381.4`, `4961.3` |
| 22 | `Stage of Ground Water Extraction (%)` | numeric with one blank | 358 | 1 | 283 | `79.6`, `62`, `59.9` |
| 23 | `Categorization (OE/Critical/Semi critical/Safe)` | categorical/text | 359 | 0 | 6 | `semi_critical`, `safe` |

## 3. Numeric columns

The following statistics use the source text values parsed as numeric for analysis only. Units and precision are unchanged in the CSV. Means are arithmetic means over non-null values and are reported without changing the source file.

| Column | Minimum | Maximum | Mean | Non-null count |
|---|---:|---:|---:|---:|
| `Sl. No` | 1 | 359 | 180 | 359 |
| `Total Geographical Area` | 1300 | 224761 | 72520.6144011142 | 359 |
| `Recharge Worthy Area` | 1300 | 224761 | 72520.6144011142 | 359 |
| `Recharge from Rainfall-Monsoon` | 0 | 15780.6 | 5764.25626740947 | 359 |
| `Recharge from Other Sources-Monsoon` | 0 | 32441 | 767.540111420613 | 359 |
| `Recharge from Rainfall-Non-Monsoon` | 0 | 3955.2 | 204.595264623955 | 359 |
| `Recharge from Other Sources-Non-Monsoon` | 0 | 24690.3 | 2465.443454039 | 359 |
| `Total Annual Ground Water Recharge (Ham)` | 0 | 40689.2 | 9201.8356545961 | 359 |
| `Total Natural Discharges (Ham)` | 0 | 3827 | 525.667409470753 | 359 |
| `Annual Extractable Ground Water Resource (Ham)` | 0 | 36862.2 | 8676.16796657381 | 359 |
| `Irrigation Use (Ham)` | 0 | 19183.8 | 4199.08997214485 | 359 |
| `Industrial Use (Ham)` | 0 | 362.2 | 8.73231197771588 | 359 |
| `Domestic Use (Ham)` | 0 | 2235.6 | 389.442896935933 | 359 |
| `Total Extraction (Ham)` | 0 | 19797.6 | 4597.26713091922 | 359 |
| `Annual GW Allocation for Domestic Use as on 2025 (Ham)` | 1.8 | 2235.6 | 406.126183844011 | 359 |
| `Net Ground Water Availability for future use (Ham)` | 0 | 33672.2 | 4203.25571030641 | 359 |
| `Stage of Ground Water Extraction (%)` | 5.3 | 125.9 | 49.6916201117319 | 358 |

## 4. Categorical columns

### State and codes

- `State code`: one distinct value, `MH`.
- `State District Code`: 36 distinct values.
- `State District Block Code`: 359 distinct values.

### District

There are 36 distinct district values:

`Ahmednagar`, `Akola`, `Amravati`, `Aurangabad`, `Beed`, `Bhandara`, `Buldhana`, `Chandrapur`, `Dhule`, `Gadchiroli`, `Gondia`, `Hingoli`, `Jalgaon`, `Jalna`, `Kolhapur`, `Latur`, `Mumbai`, `Mumbai Sub`, `Nagpur`, `Nanded`, `Nandurbar`, `Nashik`, `Osmanabad`, `Palghar`, `Parbhani`, `Pune`, `Raigad`, `Ratnagiri`, `Sangli`, `Satara`, `Sindhudurg`, `Solapur`, `Thane`, `Wardha`, `Washim`, `Yawatmal`.

The spelling and capitalization above are the CSV values; no geographic normalization was applied.

### Assessment unit

- Column: `Assessment Unit Name`
- Unique count: 350 across 359 records
- First 10 examples: `Akola`, `Jamkhed`, `Karjat`, `Kopargaon`, `Nagar`, `Newasa`, `Parner`, `Pathardi`, `Rahuri`, `Rhata`

### Classification/category

The actual classification column is `Categorization (OE/Critical/Semi critical/Safe)`. Exact distinct values and record counts are:

| Exact CSV value | Count |
|---|---:|
| `safe` | 302 |
| `semi_critical` | 40 |
| `critical` | 7 |
| `over_exploited` | 8 |
| `salinity` | 1 |
| `semi critical` | 1 |

These values are reported exactly as stored. They were not merged or standardized.

## 5. Geographic coverage

- Unique districts: 36
- Unique assessment-unit names: 350
- Records: 359
- State code coverage: `MH` in all 359 records
- District examples: `Ahmednagar`, `Akola`, `Amravati`, `Chandrapur`, `Nanded`, `Pune`, `Mumbai Sub`
- Assessment-unit examples: `Akola`, `Jamkhed`, `Karjat`, `Kopargaon`, `Nagar`, `Newasa`, `Parner`, `Pathardi`, `Rahuri`, `Rhata`

The CSV contains district and assessment-unit fields, plus state district/block code fields. This profile does not infer any additional boundary or geographic hierarchy beyond those columns.

## 6. Missing values

Blank cells were counted as missing. Missing values were not replaced with zero or otherwise interpreted.

| Column | Missing count | Missing percentage |
|---|---:|---:|
| `Sl. No` | 0 | 0% |
| `State code` | 0 | 0% |
| `State District Code` | 0 | 0% |
| `State District Block Code` | 0 | 0% |
| `District` | 0 | 0% |
| `Assessment Unit Name` | 0 | 0% |
| `Total Geographical Area` | 0 | 0% |
| `Recharge Worthy Area` | 0 | 0% |
| `Recharge from Rainfall-Monsoon` | 0 | 0% |
| `Recharge from Other Sources-Monsoon` | 0 | 0% |
| `Recharge from Rainfall-Non-Monsoon` | 0 | 0% |
| `Recharge from Other Sources-Non-Monsoon` | 0 | 0% |
| `Total Annual Ground Water Recharge (Ham)` | 0 | 0% |
| `Total Natural Discharges (Ham)` | 0 | 0% |
| `Annual Extractable Ground Water Resource (Ham)` | 0 | 0% |
| `Irrigation Use (Ham)` | 0 | 0% |
| `Industrial Use (Ham)` | 0 | 0% |
| `Domestic Use (Ham)` | 0 | 0% |
| `Total Extraction (Ham)` | 0 | 0% |
| `Annual GW Allocation for Domestic Use as on 2025 (Ham)` | 0 | 0% |
| `Net Ground Water Availability for future use (Ham)` | 0 | 0% |
| `Stage of Ground Water Extraction (%)` | 1 | 0.27855% |
| `Categorization (OE/Critical/Semi critical/Safe)` | 0 | 0% |

The single missing cell is record 29's `Stage of Ground Water Extraction (%)`, as documented in the extraction notes.

## 7. Duplicate analysis

- Completely duplicated rows: 0
- Duplicate district plus assessment-unit pairs: 0
- Repeated assessment-unit names: 9 names occur more than once
- Repeated assessment-unit records: 9 additional rows beyond one row per repeated name

Repeated assessment-unit names are:

`Akola`, `Ashti`, `Jalgaon`, `Kalamb`, `Karanja`, `Karjat`, `Khed`, `Malegaon`, `Nandgaon`.

The repeated names do not form duplicate district/assessment-unit pairs in this CSV. Because this is a single assessment year and names can recur across districts, repeated names are reported as an observable property and were not treated as errors or removed.

## 8. Classification analysis

The classification column identified from the actual CSV is:

`Categorization (OE/Critical/Semi critical/Safe)`

Exact values present:

- `safe`
- `semi_critical`
- `critical`
- `over_exploited`
- `salinity`
- `semi critical`

The values are not normalized or merged. In particular, `semi_critical` and `semi critical` remain distinct source values in this profile.

## 9. Data-quality observations

Observable issues and extraction characteristics only:

- One blank numeric cell exists in `Stage of Ground Water Extraction (%)`.
- `Categorization (OE/Critical/Semi critical/Safe)` contains six exact spellings/labels, including both `semi_critical` and `semi critical`.
- Nine assessment-unit names repeat, but no district plus assessment-unit pair repeats.
- `State District Block Code` is unique for all 359 records.
- `State District Code` and `District` both have 36 unique values.
- `Industrial Use (Ham)` has only 103 distinct values across 359 records; the value `0` is a common source value. This is an observation, not an interpretation of missingness.
- Several numeric columns have fewer unique values than rows, including recharge components, natural discharges, sector-use fields, and annual domestic allocation. This is not by itself evidence of duplication or error.
- No mixed numeric/non-numeric values were detected in the populated numeric fields during profiling.
- No footnote text or OCR artifacts were observed in the CSV values during this profile.
- Source units and semantic meanings remain those of the source report; this profile does not reinterpret them.

## 10. Normalization candidates

These are future candidates only. No normalization was performed:

- Column-name normalization for application-facing field names.
- District-name and assessment-unit-name normalization after geographic rules are established.
- Clarification of whether `Assessment Unit Name` should map to block, taluka, or a broader assessment-unit concept.
- Numeric representation and decimal-precision policy.
- Missing-value representation and validation rules.
- Category vocabulary handling for `semi_critical` versus `semi critical` and other exact source labels.
- Treatment and naming of source code fields.
- Explicit unit metadata for fields ending in `(Ham)` and area fields.
- Handling of repeated assessment-unit names across districts.
- Treatment of the blank stage value for record 29.

## 11. Proposed logical mapping

The mapping below is based only on the actual CSV and the current data contract. Confidence indicates how directly the source column matches the contract concept, not whether future normalization is complete.

| Data-contract concept | Actual CSV column | Confidence | Notes |
|---|---|---|---|
| `district` | `District` | High | Direct district field; 36 distinct values. |
| `block` | `Assessment Unit Name` | Medium | The report calls the units blocks/mandals/taluks, but this CSV column is explicitly named `Assessment Unit Name`; do not assume it is exclusively a block field. |
| `year` | Not present in 2024 extracted dataset. | High | The assessment year is documented as 2024 in source/report metadata, not as a CSV column. |
| `recharge` | `Total Annual Ground Water Recharge (Ham)` | High | Direct total recharge field; source unit wording is retained. |
| `extraction` | `Total Extraction (Ham)` | High | Direct total extraction field; source unit wording is retained. |
| `classification` | `Categorization (OE/Critical/Semi critical/Safe)` | High | Direct categorization field with exact source values. |
| state | `State code` | High | All rows contain `MH`; this is additional to the current logical record. |
| district code | `State District Code` | Medium | Code field present; exact code semantics are source-defined. |
| assessment-unit code | `State District Block Code` | Medium | Code field is unique across all rows; the profile does not reinterpret its hierarchy. |
| total geographical area | `Total Geographical Area` | High | Direct source field; units are not renamed or converted. |
| recharge-worthy area | `Recharge Worthy Area` | High | Direct source field. |
| natural discharge | `Total Natural Discharges (Ham)` | High | Direct source field. |
| irrigation extraction/use | `Irrigation Use (Ham)` | High | Direct sector-use field. |
| industrial extraction/use | `Industrial Use (Ham)` | High | Direct sector-use field. |
| domestic extraction/use | `Domestic Use (Ham)` | High | Direct sector-use field. |
| net groundwater availability | `Net Ground Water Availability for future use (Ham)` | High | Direct source field. |
| stage of groundwater extraction | `Stage of Ground Water Extraction (%)` | High | Direct source field with one blank value. |
| annual extractable groundwater resource | `Annual Extractable Ground Water Resource (Ham)` | High | Direct source field. |

The current data contract requires a year concept, but the extracted CSV itself has no year column. The assessment year must remain provenance metadata until a future data model explicitly decides how to represent it.

## Profiling scope

This document profiles the local extracted CSV only. No web research, external-source inspection, CSV modification, database work, dependency installation, or application-code change was performed.
