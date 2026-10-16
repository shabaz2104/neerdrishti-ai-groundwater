import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const CSV_PATH = resolve(
  ROOT,
  "data/processed/groundwater_2024_normalized.csv",
);
const TABLE_NAME = "groundwater_assessments";
const EXPECTED_ROWS = 359;
const EXPECTED_YEAR = 2024;
const EXPECTED_DISTRICTS = 36;
const EXPECTED_ASSESSMENT_UNITS = 350;
const EXPECTED_CLASSIFICATIONS = [
  "critical",
  "over_exploited",
  "safe",
  "salinity",
  "semi_critical",
];

const EXPECTED_HEADERS = [
  "district",
  "assessment_unit",
  "year",
  "recharge",
  "extraction",
  "classification",
  "state_code",
  "district_code",
  "assessment_unit_code",
  "source_serial_number",
  "total_geographical_area",
  "recharge_worthy_area",
  "recharge_from_rainfall_monsoon",
  "recharge_from_other_sources_monsoon",
  "recharge_from_rainfall_non_monsoon",
  "recharge_from_other_sources_non_monsoon",
  "total_natural_discharges",
  "annual_extractable_groundwater_resource",
  "irrigation_use",
  "industrial_use",
  "domestic_use",
  "annual_gw_allocation_for_domestic_use_as_on_2025",
  "net_groundwater_availability_for_future_use",
  "stage_of_groundwater_extraction_percent",
];

const NUMERIC_COLUMNS = [
  "year",
  "source_serial_number",
  "total_geographical_area",
  "recharge_worthy_area",
  "recharge_from_rainfall_monsoon",
  "recharge_from_other_sources_monsoon",
  "recharge_from_rainfall_non_monsoon",
  "recharge_from_other_sources_non_monsoon",
  "recharge",
  "extraction",
  "total_natural_discharges",
  "annual_extractable_groundwater_resource",
  "irrigation_use",
  "industrial_use",
  "domestic_use",
  "annual_gw_allocation_for_domestic_use_as_on_2025",
  "net_groundwater_availability_for_future_use",
  "stage_of_groundwater_extraction_percent",
  "source_year",
];

const SOURCE_DOCUMENT =
  "REPORT ON DYNAMIC GROUND WATER RESOURCES OF MAHARASHTRA 2024";
const SOURCE_REFERENCE =
  "ASSESSMENT OF DYNAMIC GROUND WATER RESOURCES OF MAHARASHTRA TALUKA WISE 2024, Annexure VI, PDF pages 96-99 (printed report pages 81-84)";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"') {
      inQuotes = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\r") {
      if (text[index + 1] === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (inQuotes) {
    throw new Error("The normalized CSV contains an unterminated quoted field.");
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function requiredText(value, field, lineNumber) {
  if (value === "") {
    throw new Error(`line ${lineNumber}: ${field} is blank`);
  }
  return value;
}

function requiredInteger(value, field, lineNumber) {
  if (!/^-?\d+$/.test(value)) {
    throw new Error(`line ${lineNumber}: ${field} is not an integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`line ${lineNumber}: ${field} is outside the safe integer range`);
  }
  return parsed;
}

function requiredNumeric(value, field, lineNumber) {
  if (value === "" || !/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) {
    throw new Error(`line ${lineNumber}: ${field} is not a numeric value`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`line ${lineNumber}: ${field} is not finite`);
  }
  return parsed;
}

function optionalNumeric(value, field, lineNumber) {
  return value === "" ? null : requiredNumeric(value, field, lineNumber);
}

function logicalKey(record) {
  return [record.district, record.assessment_unit, record.year].join("\u001f");
}

function parseSourceFile() {
  const csvText = readFileSync(CSV_PATH, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    throw new Error("The normalized CSV is empty.");
  }

  const [headers, ...dataRows] = rows;
  if (JSON.stringify(headers) !== JSON.stringify(EXPECTED_HEADERS)) {
    throw new Error(
      `CSV headers do not match the expected normalized schema. Expected ${EXPECTED_HEADERS.length} columns.`,
    );
  }

  const rejectedRows = [];
  const records = [];

  dataRows.forEach((values, index) => {
    const lineNumber = index + 2;
    try {
      if (values.length !== EXPECTED_HEADERS.length) {
        throw new Error(
          `line ${lineNumber}: expected ${EXPECTED_HEADERS.length} fields, found ${values.length}`,
        );
      }

      const source = Object.fromEntries(
        EXPECTED_HEADERS.map((header, valueIndex) => [header, values[valueIndex]]),
      );
      const year = requiredInteger(source.year, "year", lineNumber);
      if (year !== EXPECTED_YEAR) {
        throw new Error(`line ${lineNumber}: year must be ${EXPECTED_YEAR}`);
      }

      const classification = requiredText(
        source.classification,
        "classification",
        lineNumber,
      );
      if (!EXPECTED_CLASSIFICATIONS.includes(classification)) {
        throw new Error(
          `line ${lineNumber}: unsupported classification ${classification}`,
        );
      }

      const record = {
        district: requiredText(source.district, "district", lineNumber),
        assessment_unit: requiredText(
          source.assessment_unit,
          "assessment_unit",
          lineNumber,
        ),
        year,
        recharge: requiredNumeric(source.recharge, "recharge", lineNumber),
        extraction: requiredNumeric(
          source.extraction,
          "extraction",
          lineNumber,
        ),
        classification,
        state_code: requiredText(source.state_code, "state_code", lineNumber),
        district_code: requiredText(
          source.district_code,
          "district_code",
          lineNumber,
        ),
        assessment_unit_code: requiredText(
          source.assessment_unit_code,
          "assessment_unit_code",
          lineNumber,
        ),
        source_serial_number: requiredInteger(
          source.source_serial_number,
          "source_serial_number",
          lineNumber,
        ),
        total_geographical_area: requiredNumeric(
          source.total_geographical_area,
          "total_geographical_area",
          lineNumber,
        ),
        recharge_worthy_area: requiredNumeric(
          source.recharge_worthy_area,
          "recharge_worthy_area",
          lineNumber,
        ),
        recharge_from_rainfall_monsoon: requiredNumeric(
          source.recharge_from_rainfall_monsoon,
          "recharge_from_rainfall_monsoon",
          lineNumber,
        ),
        recharge_from_other_sources_monsoon: requiredNumeric(
          source.recharge_from_other_sources_monsoon,
          "recharge_from_other_sources_monsoon",
          lineNumber,
        ),
        recharge_from_rainfall_non_monsoon: requiredNumeric(
          source.recharge_from_rainfall_non_monsoon,
          "recharge_from_rainfall_non_monsoon",
          lineNumber,
        ),
        recharge_from_other_sources_non_monsoon: requiredNumeric(
          source.recharge_from_other_sources_non_monsoon,
          "recharge_from_other_sources_non_monsoon",
          lineNumber,
        ),
        total_natural_discharges: requiredNumeric(
          source.total_natural_discharges,
          "total_natural_discharges",
          lineNumber,
        ),
        annual_extractable_groundwater_resource: requiredNumeric(
          source.annual_extractable_groundwater_resource,
          "annual_extractable_groundwater_resource",
          lineNumber,
        ),
        irrigation_use: requiredNumeric(
          source.irrigation_use,
          "irrigation_use",
          lineNumber,
        ),
        industrial_use: requiredNumeric(
          source.industrial_use,
          "industrial_use",
          lineNumber,
        ),
        domestic_use: requiredNumeric(
          source.domestic_use,
          "domestic_use",
          lineNumber,
        ),
        annual_gw_allocation_for_domestic_use_as_on_2025: requiredNumeric(
          source.annual_gw_allocation_for_domestic_use_as_on_2025,
          "annual_gw_allocation_for_domestic_use_as_on_2025",
          lineNumber,
        ),
        net_groundwater_availability_for_future_use: requiredNumeric(
          source.net_groundwater_availability_for_future_use,
          "net_groundwater_availability_for_future_use",
          lineNumber,
        ),
        stage_of_groundwater_extraction_percent: optionalNumeric(
          source.stage_of_groundwater_extraction_percent,
          "stage_of_groundwater_extraction_percent",
          lineNumber,
        ),
        source_year: year,
        source_document: SOURCE_DOCUMENT,
        source_reference: SOURCE_REFERENCE,
      };

      records.push(record);
    } catch (error) {
      rejectedRows.push({
        line: lineNumber,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  });

  if (rejectedRows.length > 0) {
    const details = rejectedRows
      .map(({ line, reason }) => `line ${line}: ${reason}`)
      .join("\n");
    throw new Error(`Source validation rejected ${rejectedRows.length} row(s):\n${details}`);
  }

  return records;
}

function summarizeRecords(records) {
  const keyCounts = new Map();
  records.forEach((record) => {
    const key = logicalKey(record);
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  });

  const duplicateKeys = [...keyCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
  const missingStageRecords = records.filter(
    (record) => record.stage_of_groundwater_extraction_percent === null,
  );

  return {
    rows: records.length,
    districts: new Set(records.map((record) => record.district)).size,
    assessmentUnits: new Set(records.map((record) => record.assessment_unit)).size,
    years: [...new Set(records.map((record) => record.year))].sort(),
    classifications: [...new Set(records.map((record) => record.classification))].sort(),
    duplicateLogicalKeys: duplicateKeys,
    missingStageRecords: missingStageRecords.map((record) => ({
      source_serial_number: record.source_serial_number,
      district: record.district,
      assessment_unit: record.assessment_unit,
    })),
  };
}

function assertLocalSummary(summary) {
  const problems = [];
  if (summary.rows !== EXPECTED_ROWS) {
    problems.push(`expected ${EXPECTED_ROWS} rows, found ${summary.rows}`);
  }
  if (summary.districts !== EXPECTED_DISTRICTS) {
    problems.push(
      `expected ${EXPECTED_DISTRICTS} districts, found ${summary.districts}`,
    );
  }
  if (summary.assessmentUnits !== EXPECTED_ASSESSMENT_UNITS) {
    problems.push(
      `expected ${EXPECTED_ASSESSMENT_UNITS} assessment units, found ${summary.assessmentUnits}`,
    );
  }
  if (JSON.stringify(summary.years) !== JSON.stringify([EXPECTED_YEAR])) {
    problems.push(`expected year ${EXPECTED_YEAR}, found ${summary.years.join(", ")}`);
  }
  if (
    JSON.stringify(summary.classifications) !==
    JSON.stringify(EXPECTED_CLASSIFICATIONS)
  ) {
    problems.push(
      `classification values differ: ${summary.classifications.join(", ")}`,
    );
  }
  if (summary.duplicateLogicalKeys.length > 0) {
    problems.push(
      `duplicate logical keys: ${summary.duplicateLogicalKeys.join(", ")}`,
    );
  }
  if (summary.missingStageRecords.length !== 1) {
    problems.push(
      `expected one missing stage value, found ${summary.missingStageRecords.length}`,
    );
  }

  if (problems.length > 0) {
    throw new Error(`Local dataset validation failed:\n- ${problems.join("\n- ")}`);
  }
}

function printSummary(label, summary) {
  console.log(`${label}:`);
  console.log(`  rows: ${summary.rows}`);
  console.log(`  districts: ${summary.districts}`);
  console.log(`  assessment units: ${summary.assessmentUnits}`);
  console.log(`  years: ${summary.years.join(", ")}`);
  console.log(`  classifications: ${summary.classifications.join(", ")}`);
  console.log(`  duplicate logical keys: ${summary.duplicateLogicalKeys.length}`);
  console.log(
    `  missing stage values: ${summary.missingStageRecords.length}`,
  );
}

function createImportClient() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Database import unavailable: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required. No database write was attempted.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function upsertRecords(supabase, records) {
  const batchSize = 50;
  const failures = [];

  for (let start = 0; start < records.length; start += batchSize) {
    const batch = records.slice(start, start + batchSize);
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(batch, {
        onConflict: "district,assessment_unit,year",
        ignoreDuplicates: false,
      });

    if (!error) {
      continue;
    }

    for (const record of batch) {
      const { error: rowError } = await supabase
        .from(TABLE_NAME)
        .upsert([record], {
          onConflict: "district,assessment_unit,year",
          ignoreDuplicates: false,
        });
      if (rowError) {
        failures.push({
          key: logicalKey(record),
          reason: rowError.message,
        });
      }
    }
  }

  if (failures.length > 0) {
    const details = failures
      .map(({ key, reason }) => `${key}: ${reason}`)
      .join("\n");
    throw new Error(`Database rejected ${failures.length} row(s):\n${details}`);
  }
}

const DATABASE_COMPARE_COLUMNS = [
  ...EXPECTED_HEADERS,
  "source_year",
  "source_document",
  "source_reference",
];

function assertDatabaseNumericTypes(rows) {
  const failures = [];
  rows.forEach((row) => {
    NUMERIC_COLUMNS.forEach((column) => {
      const value = row[column];
      if (value !== null && typeof value !== "number") {
        failures.push(`${logicalKey(row)}.${column} returned as ${typeof value}`);
      }
    });
  });
  if (failures.length > 0) {
    throw new Error(
      `Database numeric type validation failed:\n- ${failures.slice(0, 10).join("\n- ")}`,
    );
  }
}

function compareRecords(sourceRecords, databaseRows) {
  const sourceByKey = new Map(sourceRecords.map((record) => [logicalKey(record), record]));
  const databaseByKey = new Map(databaseRows.map((record) => [logicalKey(record), record]));
  const mismatches = [];

  sourceByKey.forEach((sourceRecord, key) => {
    const databaseRecord = databaseByKey.get(key);
    if (!databaseRecord) {
      mismatches.push(`${key}: missing from database`);
      return;
    }

    DATABASE_COMPARE_COLUMNS.forEach((column) => {
      const sourceValue = sourceRecord[column];
      const databaseValue = databaseRecord[column];
      if (sourceValue !== databaseValue) {
        mismatches.push(
          `${key}.${column}: source=${String(sourceValue)} database=${String(databaseValue)}`,
        );
      }
    });
  });

  if (mismatches.length > 0) {
    throw new Error(
      `Database/source comparison found ${mismatches.length} mismatch(es):\n- ${mismatches.slice(0, 20).join("\n- ")}`,
    );
  }
}

async function fetchDatabaseRows(supabase) {
  const { data, error, count } = await supabase
    .from(TABLE_NAME)
    .select(DATABASE_COMPARE_COLUMNS.join(","), { count: "exact" })
    .range(0, EXPECTED_ROWS + 999);

  if (error) {
    throw new Error(`Database validation query failed: ${error.message}`);
  }
  if (!data || count === null) {
    throw new Error("Database validation query returned no count metadata.");
  }
  if (count !== data.length) {
    throw new Error(
      `Database query returned ${data.length} rows but exact count reported ${count}; increase the query range before validating.`,
    );
  }

  return data;
}

async function runDatabaseValidation(supabase, sourceRecords) {
  const databaseRows = await fetchDatabaseRows(supabase);
  assertDatabaseNumericTypes(databaseRows);
  compareRecords(sourceRecords, databaseRows);

  const summary = summarizeRecords(databaseRows);
  printSummary("Database validation", summary);
  if (summary.rows !== EXPECTED_ROWS) {
    throw new Error(
      `Database row count mismatch: expected ${EXPECTED_ROWS}, found ${summary.rows}`,
    );
  }
  assertLocalSummary(summary);

  const representatives = [sourceRecords[0], sourceRecords[28]].map((record) =>
    logicalKey(record),
  );
  console.log(`  representative records compared: ${representatives.join(" | ")}`);
  console.log("  source/database comparison: exact match");
  console.log("  numeric database types: validated as numbers");
  console.log("  idempotence: upsert uses the logical key conflict target");
}

function printUsage() {
  console.log("Usage:");
  console.log("  node scripts/import-groundwater.mjs --validate");
  console.log("  node scripts/import-groundwater.mjs --import");
  console.log("");
  console.log("--validate checks the local normalized CSV only.");
  console.log(
    "--import validates locally, upserts with the logical key, and validates the database.",
  );
}

async function main() {
  const mode = process.argv[2];
  if (!mode || mode === "--help") {
    printUsage();
    return;
  }
  if (mode !== "--validate" && mode !== "--import") {
    throw new Error(`Unknown option ${mode}. Use --validate or --import.`);
  }

  const sourceRecords = parseSourceFile();
  const sourceSummary = summarizeRecords(sourceRecords);
  assertLocalSummary(sourceSummary);
  printSummary("Local source validation", sourceSummary);

  if (mode === "--validate") {
    console.log("  rejected rows: 0");
    console.log("  database import: not requested");
    return;
  }

  const supabase = createImportClient();
  await upsertRecords(supabase, sourceRecords);
  console.log(`Import completed: ${sourceRecords.length} row(s) upserted.`);
  await runDatabaseValidation(supabase, sourceRecords);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
