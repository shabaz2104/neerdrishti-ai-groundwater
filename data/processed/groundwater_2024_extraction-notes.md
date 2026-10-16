# Groundwater 2024 Extraction Notes

## Source

- Source filename: `data/raw/cgwb_maharashtra_groundwater_assessment_2024.pdf`
- Report title: `REPORT ON DYNAMIC GROUND WATER RESOURCES OF MAHARASHTRA 2024`
- Assessment year: 2024
- Source URL: https://cgwb.gov.in/cgwbpnm/public/uploads/documents/17482445781522785056file.pdf
- Source checksum verified before processing: `F0F2760D04C4D2919E74590C77D31FEE99CEBF50D63BC66E94C65FAAA1E16947`

## Table identification

- Table title exactly as shown: `ASSESSMENT OF DYNAMIC GROUND WATER RESOURCES OF MAHARASHTRA TALUKA WISE 2024`
- Annexure: `Annexure VI`
- Section/chapter: Annexure VI, following the report's Maharashtra dynamic groundwater resource assessment chapters
- PDF pages: 96-99
- Printed report pages: 81-84
- Table boundary: Annexure VII begins on PDF page 100

## Extraction method

The raw PDF was processed with Poppler `pdftohtml -xml` using PDF pages 96-99. The coordinate-aware XML text cells were grouped by their table-row y-coordinate and sorted by x-coordinate. Candidate rows were retained only when they contained 23 source cells, a numeric source row number, and the state code `MH`.

The CSV was written from those source cells with the original source column terminology. Whitespace was joined only where the PDF XML split a single cell across formatting lines. No numeric conversion, unit conversion, category conversion, normalization, deduplication, derived calculation, or value repair was performed.

The PDF `-table` text output was used as a secondary visual/text check, not as the source of column renaming or inferred values.

## Extracted dimensions

- Output file: `data/processed/groundwater_2024_assessment_units_raw.csv`
- Rows: 359
- Columns: 23
- Source row numbers: 1 through 359, sequentially present

Column names:

1. `Sl. No`
2. `State code`
3. `State District Code`
4. `State District Block Code`
5. `District`
6. `Assessment Unit Name`
7. `Total Geographical Area`
8. `Recharge Worthy Area`
9. `Recharge from Rainfall-Monsoon`
10. `Recharge from Other Sources-Monsoon`
11. `Recharge from Rainfall-Non-Monsoon`
12. `Recharge from Other Sources-Non-Monsoon`
13. `Total Annual Ground Water Recharge (Ham)`
14. `Total Natural Discharges (Ham)`
15. `Annual Extractable Ground Water Resource (Ham)`
16. `Irrigation Use (Ham)`
17. `Industrial Use (Ham)`
18. `Domestic Use (Ham)`
19. `Total Extraction (Ham)`
20. `Annual GW Allocation for Domestic Use as on 2025 (Ham)`
21. `Net Ground Water Availability for future use (Ham)`
22. `Stage of Ground Water Extraction (%)`
23. `Categorization (OE/Critical/Semi critical/Safe)`

## Extraction issues

- The table has a multi-row, merged header. Header terminology was transcribed from the visible report table and retained in the CSV.
- The table continues across four PDF pages and has page-break/header structure. Coordinate row grouping was used separately on each page.
- No OCR was used. The source pages contained extractable text.
- One source cell is blank: source record `29`, column `Stage of Ground Water Extraction (%)`. It was preserved as an empty CSV cell.
- No other blank CSV cells were found.
- Source category spellings and casing were retained, including values such as `semi_critical`, `over_exploited`, `critical`, `safe`, and `salinity`.
- No questionable values were guessed or silently repaired.

## Verification

Five records were manually checked against the coordinate-preserved PDF text cells: source records 1, 2, 3, 180, and 359. All 23 cells matched the generated CSV for each checked record.

The raw PDF remains unchanged. The CSV is an extraction artifact only; normalization and database loading are deferred.
