import { parse } from "csv-parse/sync";

export const CSV_MAX_BYTES = 512 * 1024;
export const CSV_MAX_ROWS = 1000;
export const CSV_YEAR = 2024;
export const CSV_MAX_NUMERIC_VALUE = 1_000_000_000_000;
export const CSV_CLASSIFICATIONS = ["safe", "semi_critical", "critical", "over_exploited", "salinity"] as const;
export const CSV_HEADERS = [
  "district", "assessment_unit", "year", "recharge", "extraction", "classification",
  "state_code", "district_code", "assessment_unit_code", "source_serial_number",
  "total_geographical_area", "recharge_worthy_area", "recharge_from_rainfall_monsoon",
  "recharge_from_other_sources_monsoon", "recharge_from_rainfall_non_monsoon",
  "recharge_from_other_sources_non_monsoon", "total_natural_discharges",
  "annual_extractable_groundwater_resource", "irrigation_use", "industrial_use",
  "domestic_use", "annual_gw_allocation_for_domestic_use_as_on_2025",
  "net_groundwater_availability_for_future_use", "stage_of_groundwater_extraction_percent",
] as const;

export const CSV_NUMERIC_FIELDS = CSV_HEADERS.filter((field) => ![
  "district", "assessment_unit", "classification", "state_code", "district_code", "assessment_unit_code",
].includes(field));

export type CsvValues = Record<(typeof CSV_HEADERS)[number], string | null>;
export type CsvRow = { rowNumber: number; values: CsvValues };
export type CsvIssue = { rowNumber: number; district: string; assessmentUnit: string; reason: string };
export type CsvComparison = { rowNumber: number; district: string; assessmentUnit: string; status: "NEW" | "UNCHANGED" | "CONFLICT" };
export type CsvReport = {
  fileName: string;
  sha256: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newRows: number;
  unchangedRows: number;
  conflictRows: number;
  rows: CsvComparison[];
  issues: CsvIssue[];
};
export type CsvImportResult = {
  importId: string;
  totalRows: number;
  newRows: number;
  insertedRows: number;
  unchangedRows: number;
  conflictRows: number;
  invalidRows: number;
  rows: CsvComparison[];
};
export type CsvActionResult = { error?: string; report?: CsvReport; result?: CsvImportResult };

export class CsvValidationError extends Error {}

export function validateCsvFile(file: { name: string; size: number; type: string }) {
  if (!file.name.toLowerCase().endsWith(".csv")) throw new CsvValidationError("Choose a .csv file.");
  if (!["", "text/csv", "application/csv", "text/plain", "application/vnd.ms-excel", "application/octet-stream"].includes(file.type)) {
    throw new CsvValidationError("The file type is not supported. Choose a UTF-8 CSV file.");
  }
  if (file.size === 0) throw new CsvValidationError("The CSV file is empty.");
  if (file.size > CSV_MAX_BYTES) throw new CsvValidationError("The CSV exceeds the 512 KiB file limit.");
}

export function csvLogicalKey(values: Pick<CsvValues, "district" | "assessment_unit" | "year">) {
  return JSON.stringify([values.district, values.assessment_unit, values.year]);
}

export function parseGroundwaterCsv(bytes: Uint8Array): { totalRows: number; rows: CsvRow[]; issues: CsvIssue[]; invalidRows: number } {
  if (!bytes.byteLength) throw new CsvValidationError("The CSV file is empty.");
  if (bytes.byteLength > CSV_MAX_BYTES) throw new CsvValidationError("The CSV exceeds the 512 KiB file limit.");
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new CsvValidationError("The file must use UTF-8 encoding."); }
  if (text.includes("\0")) throw new CsvValidationError("The file contains unsupported binary characters.");
  let cells: string[][];
  try {
    cells = parse(text, { bom: true, skip_empty_lines: true, relax_column_count: true, max_record_size: 16384 });
  } catch { throw new CsvValidationError("Malformed CSV. Check quoted fields, escaped quotes and line endings."); }
  const [headers, ...data] = cells;
  if (!headers || headers.length !== CSV_HEADERS.length || new Set(headers).size !== CSV_HEADERS.length || CSV_HEADERS.some((key) => !headers.includes(key))) {
    throw new CsvValidationError("Headers must match the 24-column normalized CSV template exactly; column order may vary.");
  }
  if (!data.length) throw new CsvValidationError("The CSV contains no assessment rows.");
  if (data.length > CSV_MAX_ROWS) throw new CsvValidationError("The CSV exceeds the 1,000-row limit.");
  const rows: CsvRow[] = [];
  const issues: CsvIssue[] = [];
  const invalid = new Set<number>();
  const keys = new Map<string, number[]>();
  for (const [index, fields] of data.entries()) {
    const rowNumber = index + 2;
    const raw = Object.fromEntries(headers.map((header, i) => [header, (fields[i] ?? "").trim()])) as Record<string, string>;
    const issue = (reason: string) => {
      invalid.add(rowNumber);
      issues.push({ rowNumber, district: raw.district.slice(0, 120), assessmentUnit: raw.assessment_unit.slice(0, 160), reason });
    };
    if (fields.length !== headers.length) { issue("Incorrect number of columns."); continue; }
    const values = { ...raw } as CsvValues;
    for (const [field, max] of [["district", 120], ["assessment_unit", 160], ["district_code", 64], ["assessment_unit_code", 64]] as const) {
      if (!raw[field] || raw[field].length > max || /[\u0000-\u001f\u007f]/.test(raw[field])) issue(`Missing or invalid ${field}.`);
    }
    if (raw.state_code !== "MH") issue("state_code must be MH for Maharashtra.");
    if (!(CSV_CLASSIFICATIONS as readonly string[]).includes(raw.classification)) issue("Invalid classification.");
    for (const field of CSV_NUMERIC_FIELDS) {
      const value = raw[field];
      if (field === "stage_of_groundwater_extraction_percent" && value === "") { values[field] = null; continue; }
      const parsedNumber = Number(value);
      if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(value) || value.length > 64 || !Number.isFinite(parsedNumber) || parsedNumber < 0 || parsedNumber > CSV_MAX_NUMERIC_VALUE) {
        issue(`Invalid number in ${field}; use a non-negative value within the supported range, and do not treat a required blank as zero.`);
      }
    }
    if (raw.year !== String(CSV_YEAR)) issue("Unsupported year. Only 2024 assessments are accepted.");
    if (!/^\d+$/.test(raw.source_serial_number) || Number(raw.source_serial_number) < 1 || Number(raw.source_serial_number) > 2147483647) issue("source_serial_number must be a positive 32-bit integer.");
    if (raw.district && raw.assessment_unit && raw.year) {
      const key = csvLogicalKey(values);
      keys.set(key, [...(keys.get(key) ?? []), rowNumber]);
    }
    rows.push({ rowNumber, values });
  }
  for (const rowNumbers of keys.values()) {
    if (rowNumbers.length < 2) continue;
    for (const rowNumber of rowNumbers) {
      const row = rows.find((item) => item.rowNumber === rowNumber)!;
      invalid.add(rowNumber);
      issues.push({ rowNumber, district: row.values.district!, assessmentUnit: row.values.assessment_unit!, reason: "Duplicate logical key inside the CSV." });
    }
  }
  return { totalRows: data.length, rows: rows.filter((row) => !invalid.has(row.rowNumber)), issues, invalidRows: invalid.size };
}
