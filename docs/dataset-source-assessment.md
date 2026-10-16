# Groundwater Dataset Source Feasibility Assessment

Research date: 2026-09-21
Repository scope: Maharashtra groundwater assessment data

## 1. Research objective

This assessment checks whether authoritative government sources support the SRS target of Maharashtra block-level groundwater assessment data for 2015-2024, including recharge, extraction, stage of extraction, classification, and historical district/block/year filtering.

The assessment records only source facts that were directly verifiable from an official page during this research. A source being official does not by itself prove that it contains every requested year, geography, or field.

## 2. Authoritative sources investigated

1. Central Ground Water Board (CGWB), Government of India: https://cgwb.gov.in/
2. Government of India Open Government Data portal: https://www.data.gov.in/
3. Government of Maharashtra portal: https://maharashtra.gov.in/
4. Maharashtra Groundwater Surveys and Development Agency (GSDA) portal: https://gsda.maharashtra.gov.in/

CGWB is the priority technical source. The CGWB resource-assessment pages were attempted directly, but the live site returned HTTP 403/429 responses or a 404 for guessed paths. Therefore, this report does not treat an uninspected CGWB PDF or data file as verified.

## 3. Source-by-source findings

### 3.1 Central Ground Water Board (CGWB)

- Organization: Central Ground Water Board, Government of India.
- Dataset/report title: The official site exposes groundwater-resource-assessment material, but a specific Maharashtra report/file and its downloadable contents could not be retrieved and verified in this research session.
- Publication year: UNKNOWN for the specific Maharashtra block/taluka file.
- Geographic scope: Not verified for the target file.
- Spatial granularity: Not verified for the target file. CGWB assessment terminology may refer to assessment units, but this report does not equate that term with a Maharashtra block or taluka without inspecting the source table.
- Time/year represented: Not verified for 2015-2024 at block/taluka level.
- Relevant fields: Not verified for the target file. The requested concepts requiring confirmation are annual recharge, extractable resource, extraction, stage of extraction, and categorization.
- File format: UNKNOWN for the target file.
- Downloadable: UNKNOWN for the target file.
- Machine-readable: UNKNOWN for the target file. A PDF report must not be treated as a machine-readable table until its tables are inspected.
- Limitation: The CGWB site blocked automated retrieval during this assessment. No CGWB year is marked YES in the matrix solely from the existence of the institution or the assessment topic.

Reference: https://cgwb.gov.in/

### 3.2 Government of India Open Government Data portal

The portal is an official Government of India/NIC platform. Its groundwater search results provided the following directly verifiable resources.

#### State-wise Details of Annual Extractable Groundwater Resources from 2020 to 2023

- Organization shown by the portal: Rajya Sabha.
- Title: State-wise Details of Annual Extractable Groundwater Resources form 2020 to 2023. The portal title contains the spelling "form".
- Publication/time period: 2020-2023.
- Geographic scope: State-wise, not block/taluka-wise.
- Spatial granularity: State.
- Relevant field verified by title: annual extractable groundwater resources.
- Recharge: Not verified from the result page.
- Extraction: Not verified from the result page.
- Stage of extraction: Not verified.
- Categorization/classification: Not verified.
- File format: CSV icon shown by the portal.
- Downloadable: Yes, the result page exposes a Download action.
- Machine-readable: Yes at the portal-resource level because CSV is offered; the exact columns were not inspected or downloaded in this ticket.
- Limitation: This resource cannot satisfy Maharashtra block/taluka filtering as presented. It also does not prove availability for 2015-2019 or 2024.

Reference: https://www.data.gov.in/resource/state-wise-details-annual-extractable-groundwater-resources-form-2020-2023

#### State/UTs-wise Groundwater Resource and their Overall Extraction Level of India during 2020

- Organization shown by the portal: Rajya Sabha.
- Title: State/UTs-wise Groundwater Resource and their Overall Extraction Level of India during 2020.
- Publication/time period: 2020.
- Geographic scope: State/UT-wise, not block/taluka-wise.
- Spatial granularity: State/UT.
- Relevant field verified by title: groundwater resource and overall extraction level.
- Recharge: Not verified from the result page.
- Extraction: Overall extraction level is indicated by the title; sector-specific extraction is not verified.
- Stage of extraction: Not verified as a separate field.
- Categorization/classification: Not verified.
- File format: CSV icon shown by the portal.
- Downloadable: Yes, the result page exposes a Download action.
- Machine-readable: Yes at the portal-resource level because CSV is offered; exact columns were not inspected or downloaded in this ticket.
- Limitation: This is state/UT level and cannot establish block/taluka coverage.

Reference: https://www.data.gov.in/resource/stateuts-wise-groundwater-resource-and-their-overall-extraction-level-india-during-2020

#### State/UT-wise categorisation of Blocks/Talukas/Mandals regarding Online Grant of NOC for Groundwater Extraction during 2013

- Organization shown by the portal: Ministry of Water Resources, River Development & Ganga Rejuvenation.
- Title: State/UT-wise categorisation of Blocks/Talukas/Mandals regarding Online Grant of NOC for Groundwater Extraction during 2013.
- Publication/time period: 2013, outside the SRS target period.
- Geographic scope: State/UT-wise assessment-unit categorization.
- Spatial granularity: Blocks/Talukas/Mandals, as stated in the title.
- Relevant field verified by title: categorization related to online groundwater-extraction NOC.
- Recharge: Not verified.
- Extraction: Groundwater extraction is part of the title context; annual extraction values are not verified.
- Stage of extraction: Not verified as a separate field.
- Classification: Categorization is indicated by the title.
- File format: CSV icon shown by the portal.
- Downloadable: Yes, the result page exposes a Download action.
- Machine-readable: Yes at the portal-resource level because CSV is offered; exact columns and Maharashtra rows were not inspected in this ticket.
- Limitation: This is a 2013 resource and is not evidence that any 2015-2024 annual Maharashtra assessment exists.

Reference: https://www.data.gov.in/resource/stateut-wise-categorisation-blockstalukasmandals-regarding-online-grant-noc-groundwater

The data.gov.in search itself returned the above three relevant groundwater results. It did not expose a verified Maharashtra block/taluka annual resource for every year 2015-2024.

### 3.3 Maharashtra government and GSDA

- Organization: Government of Maharashtra; groundwater work is associated with the Groundwater Surveys and Development Agency (GSDA).
- Government portal: The Maharashtra portal identifies itself as the official Maharashtra government site.
- GSDA portal: The supplied GSDA URL redirected to a Google Maps embed for the agency location rather than a usable dataset or publication index.
- Dataset/report title: No groundwater assessment dataset or report with verified 2015-2024 block/taluka tables was retrievable from the inspected pages.
- Publication year, geography, fields, format, downloadability, and machine-readability: UNKNOWN for the target data.
- Limitation: The inspected Maharashtra pages were general government/news pages, not a dataset catalog. A direct GSDA request or a manually navigated official archive may be required.

References:

- https://maharashtra.gov.in/
- https://maharashtra.gov.in/Site/ViewAllNews
- https://gsda.maharashtra.gov.in/

## 4. Year availability matrix

Status values are intentionally conservative. `YES` means the official result verified that year and attribute. `NO` means the cited official result explicitly does not provide that attribute at the required level. `UNKNOWN` means the source was not sufficiently inspectable to verify it.

| Year | Authoritative source | Maharashtra available | Block/taluka level | Recharge | Extraction | Classification | Machine-readable | Notes |
|---|---|---|---|---|---|---|---|---|
| 2015 | Not verified | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No verified official annual block/taluka resource found. |
| 2016 | Not verified | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No verified official annual block/taluka resource found. |
| 2017 | Not verified | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No verified official annual block/taluka resource found. |
| 2018 | Not verified | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No verified official annual block/taluka resource found. |
| 2019 | Not verified | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No verified official annual block/taluka resource found. |
| 2020 | data.gov.in state-wise resources | YES | NO | UNKNOWN | YES for overall/state-level resource title | UNKNOWN | YES | Verified state/UT CSV resources; not block/taluka data. |
| 2021 | data.gov.in state-wise annual extractable resource | YES | NO | UNKNOWN | UNKNOWN | UNKNOWN | YES | State-wise annual extractable resource result covers 2020-2023; no block/taluka or extraction field verified. |
| 2022 | data.gov.in state-wise annual extractable resource | YES | NO | UNKNOWN | UNKNOWN | UNKNOWN | YES | State-wise annual extractable resource result covers 2020-2023; no block/taluka or extraction field verified. |
| 2023 | data.gov.in state-wise annual extractable resource | YES | NO | UNKNOWN | UNKNOWN | UNKNOWN | YES | State-wise annual extractable resource result covers 2020-2023; no block/taluka or extraction field verified. |
| 2024 | Not verified | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | No verified official annual block/taluka resource found. |

### Matrix interpretation

No year has verified block/taluka-level Maharashtra data for all required fields. The `YES` values for 2020-2023 refer only to state-wise data resources, not to the SRS-required spatial granularity.

## 5. Available fields

Directly verified from official result titles, not from downloaded column headers:

- State/UT scope: present in the titles of the state-wise resources.
- Year: present as 2020-2023 for the annual extractable-resource resource and 2020 for the overall-extraction resource.
- Annual extractable groundwater resource: indicated by the 2020-2023 resource title.
- Overall extraction level: indicated by the 2020 resource title.
- Block/taluka/mandal categorization: indicated by the 2013 data.gov.in resource title.

Not verified as available fields in the target Maharashtra dataset:

- district
- block or taluka identifier suitable for filtering
- annual groundwater recharge
- sector-specific irrigation extraction
- sector-specific industrial extraction
- sector-specific domestic extraction
- stage of groundwater extraction as a numeric field
- classification/category for each 2015-2024 annual Maharashtra record
- net groundwater availability

The resource pages were not downloaded or transformed, so exact column names, units, null handling, and row-level Maharashtra coverage remain unknown.

## 6. Geographic granularity

The SRS requires Maharashtra block-level data and district/block/year filtering. The directly verified data.gov.in resources for 2020-2023 are state-wise or state/UT-wise. They do not satisfy block/taluka granularity.

The 2013 data.gov.in resource explicitly names blocks/talukas/mandals, but it is outside the requested period and is an NOC categorization resource rather than verified annual assessment data containing all requested quantities.

CGWB and GSDA may publish assessment-unit tables, but that was not confirmed for each requested year and Maharashtra in this session.

## 7. File and machine-readable availability

- data.gov.in exposes CSV download actions for the three groundwater search results described above. This establishes portal-level machine-readable availability for those resources.
- Exact CSV schemas, row counts, units, and Maharashtra records were not inspected because this ticket prohibits data acquisition and transformation.
- CGWB report/file format and machine-readable availability for the target Maharashtra material remain UNKNOWN.
- GSDA file format and machine-readable availability remain UNKNOWN.
- No report, PDF, CSV, Excel file, or other dataset was downloaded into the repository.

## 8. Data-quality considerations

- Assessment year and publication year must be stored separately. A report published in one year may represent an assessment year stated in the report.
- State-wise resources cannot be presented as block-level records.
- Block, taluka, mandal, and assessment unit must not be treated as interchangeable until the source defines the unit and provides a stable name/code.
- Units and definitions for recharge, extractable resource, extraction, and stage must be taken from the source methodology.
- Classification thresholds and category labels may change between assessment cycles; categories must not be compared across years without the applicable methodology.
- District and block boundary/name changes can create false historical differences unless source identifiers and boundary vintages are recorded.
- PDF tables, scanned tables, and portal CSV exports require independent checks for merged cells, footnotes, suppressed values, units, and transcription errors before use.
- No values were copied, interpolated, estimated, normalized, or synthesized in this assessment.

## 9. Missing years or missing fields

The full 2015-2024 scope is not supported by verified block/taluka evidence from the sources inspected.

- 2015-2019: No authoritative Maharashtra block/taluka annual resource was verified.
- 2020: A state/UT machine-readable resource and a state-wise 2020-2023 resource were verified, but block/taluka data and the full field set were not.
- 2021-2023: State-wise annual extractable-resource coverage was verified, but block/taluka data and the full field set were not.
- 2024: No authoritative Maharashtra block/taluka annual resource was verified.

Missing or unverified fields include recharge, sector-specific extraction, stage of extraction, classification, net availability, district/block identifiers, units, and methodology metadata.

Missing years must remain missing. No year may be filled by interpolation, copying another year, estimating, or relabeling.

## 10. Recommended dataset construction strategy

**Conclusion: Option C for the current evidence.** The exact 2015-2024 Maharashtra block-level scope cannot currently be supported from the authoritative pages and resources verified in this assessment.

Directly available:

- Official state-wise machine-readable groundwater resources for 2020-2023 through data.gov.in.
- A 2020 state/UT resource and overall extraction-level resource through data.gov.in.
- A 2013 block/taluka/mandal categorization resource through data.gov.in, outside the requested period.

Can potentially be combined after separate verification:

- CGWB annual or periodic assessment reports and Maharashtra assessment-unit tables, if official files for particular assessment years are obtained and their definitions, units, geography, and fields are confirmed.
- GSDA/Maharashtra records, if the agency supplies authoritative year-specific block/taluka tables.
- Separate annual sources may be combined only after preserving source year, assessment year, source file, methodology, unit definitions, and geographic identifiers.

Cannot be obtained from the evidence in this ticket:

- A single verified CSV covering every Maharashtra block/taluka for every year 2015-2024.
- Verified annual block-level recharge, extraction, classification, and all requested sector fields for the full period.
- Permission to fill unverified years or fields with estimates or derived values.

Remains unknown:

- Which CGWB assessment years have complete Maharashtra block/taluka tables.
- Whether GSDA can provide machine-readable historical tables for the missing years.
- Whether the assessment unit, boundary, field definitions, and classification thresholds remain comparable across years.

Recommended next action is an official-source acquisition request or manual retrieval of named CGWB and GSDA publications, followed by schema and coverage verification. No production schema or normalized dataset should be designed as though the 2015-2024 block-level scope is already available.

## 11. Source references

- Central Ground Water Board: https://cgwb.gov.in/
- Government of India Open Government Data portal: https://www.data.gov.in/
- State-wise Details of Annual Extractable Groundwater Resources from 2020 to 2023: https://www.data.gov.in/resource/state-wise-details-annual-extractable-groundwater-resources-form-2020-2023
- State/UTs-wise Groundwater Resource and their Overall Extraction Level of India during 2020: https://www.data.gov.in/resource/stateuts-wise-groundwater-resource-and-their-overall-extraction-level-india-during-2020
- State/UT-wise categorisation of Blocks/Talukas/Mandals regarding Online Grant of NOC for Groundwater Extraction during 2013: https://www.data.gov.in/resource/stateut-wise-categorisation-blockstalukasmandals-regarding-online-grant-noc-groundwater
- Government of Maharashtra: https://maharashtra.gov.in/
- Maharashtra government news/archive page inspected: https://maharashtra.gov.in/Site/ViewAllNews
- Maharashtra Groundwater Surveys and Development Agency: https://gsda.maharashtra.gov.in/

## Corrected CGWB Assessment-Year Verification

This section corrects the earlier CGWB-only conclusion. The official CGWB-hosted report `Report on Dynamic Ground Water Resources of Maharashtra 2024` was retrieved and inspected from:

https://cgwb.gov.in/cgwbpnm/public/uploads/documents/17482445781522785056file.pdf

The report is dated March 2025 and states that the earlier Maharashtra assessments were carried out for 2017, 2020, 2022, and 2023. It therefore verifies that those assessment years exist as named Maharashtra assessment cycles. It does not, by itself, expose the year-specific PDF URL or prove that every annexure field was unchanged in each earlier cycle.

### Assessment-year verification matrix

`YES`, `NO`, and `UNKNOWN` are used for availability claims. `PDF` identifies the verified 2024 format; it does not imply machine-readable structured data.

| Assessment year | Official CGWB source | Maharashtra | Block/Taluka/Assessment Unit | Classification | Recharge | Extraction | Extractable Resource | Format | Extraction required |
|---|---|---|---|---|---|---|---|---|---|
| 2017 | YES | YES | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | PDF reference in 2024 report | UNKNOWN |
| 2020 | YES | YES | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | PDF reference in 2024 report | UNKNOWN |
| 2022 | YES | YES | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | PDF reference in 2024 report | UNKNOWN |
| 2023 | YES | YES | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | PDF reference in 2024 report | UNKNOWN |
| 2024 | YES | YES | YES | YES | YES | YES | YES | PDF | YES |
| 2025 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

For 2017, 2020, 2022, and 2023, `Official CGWB source = YES` means the official 2024 report explicitly identifies those years as earlier Maharashtra assessment cycles. The year-specific source files and their tables were not independently retrieved in this correction, so their granularity, fields, format, accessibility, and extraction effort remain `UNKNOWN`. This is not a claim that those data are absent.

### 2024 Maharashtra assessment-unit verification

The verified 2024 report contains a table headed:

`ASSESSMENT OF DYNAMIC GROUND WATER RESOURCES OF MAHARASHTRA TALUKA WISE 2024`

The table's exact extracted field labels include:

- `State code`
- `State District Code`
- `State District Block Code`
- `District`
- `Assessment Unit Name`
- `Total Geographical Area`
- `Recharge Worthy Area`
- `Recharge from Rainfall-Monsoon`
- `Recharge from Other Sources-Monsoon`
- `Recharge from Rainfall Non-Monsoon`
- `Recharge from Other Sources Non-Monsoon`
- `Total Annual Ground Water Recharge`
- `Total Natural Discharges`
- `Annual Extractable Ground Water Resource`
- `Irrigation Use (Ham)`
- `Industrial Use (Ham)`
- `Domestic Use (Ham)`
- `Total Extraction (Ham)`
- `Annual Allocation for Domestic Use as on 2025 (Ham)`
- `Net Ground Water Availability for future use (Ham)`
- `Stage of Ground Water Extraction (%)`
- `Categorization (OE/Critical/Semi critical/Safe)`

The report describes the assessment units as `Blocks/ Mandals/ Taluks`, and the detailed table uses `Assessment Unit Name` with district and block-code columns. The report's contents also identify `Taluka-wise Assessment of Dynamic Ground Water Resources of Maharashtra, 2024` and `Categorization of Blocks/ Mandals/ Taluks in Maharashtra, 2024`.

The 2024 source is therefore:

- Source availability: YES.
- Maharashtra coverage: YES.
- Assessment-unit/taluka-level records: YES.
- Classification: YES, through `Categorization (OE/Critical/Semi critical/Safe)`.
- Recharge: YES, including total annual recharge and rainfall/other-source components.
- Extraction: YES, including total extraction and irrigation, industrial, and domestic use columns.
- Annual extractable groundwater resource: YES.
- Machine readability: NO as an already structured CSV/Excel source; the verified source is a PDF.
- Extraction effort: YES. The assessment-unit table must be extracted from the PDF if structured records are needed.

### Source availability, machine readability, and extraction effort

These are separate properties:

| Property | Correct interpretation |
|---|---|
| Source availability | The authoritative assessment or official report exists and contains source data. The 2024 Maharashtra report is YES. The 2024 report also verifies the existence of the 2017, 2020, 2022, and 2023 assessment cycles, but not their independently retrieved files. |
| Machine readability | Whether the source is already CSV, Excel, or another structured table. The verified 2024 CGWB source is a PDF, so this is NO. |
| Extraction effort | Whether PDF table extraction and validation would be needed. The verified 2024 assessment-unit table requires YES. |

`Not machine-readable` must not be interpreted as `data does not exist`. PDF tables are authoritative source data, but they require controlled extraction and validation before use.

### Corrected 2015-2024 conclusion

The verified CGWB assessment years are **non-contiguous** within the SRS period: 2017, 2020, 2022, 2023, and 2024. The 2015, 2016, 2018, 2019, and 2021 assessment years remain unverified in this correction. No missing year may be interpolated, copied, estimated, or relabeled.

The evidence now supports a defensible historical source strategy based on the available CGWB assessment cycles, with the following qualification: 2024 is directly verified as a Maharashtra taluka-wise PDF source with the required fields; the earlier listed cycles are verified as official assessment years by the 2024 report but require retrieval and inspection of their year-specific reports before their fields and granularity can be treated as equivalent. The complete annual 2015-2024 series is not established.

2025 was checked as a possible newer cycle but was not included in the initial NeerDrishti historical scope. Its official CGWB assessment status and Maharashtra assessment-unit source were not verified in this correction.
