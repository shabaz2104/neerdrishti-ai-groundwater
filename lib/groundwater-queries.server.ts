import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const TABLE_NAME = "groundwater_assessments";
const DEFAULT_TOP_LIMIT = 10;
const MAX_TOP_LIMIT = 100;

const CLASSIFICATIONS = [
  "critical",
  "over_exploited",
  "safe",
  "salinity",
  "semi_critical",
] as const;

export type GroundwaterClassification = (typeof CLASSIFICATIONS)[number];

export type QueryErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "DATABASE_ERROR"
  | "CONFIGURATION_ERROR";

export type QueryError = {
  code: QueryErrorCode;
  message: string;
};

export type QueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: QueryError };

export type GroundwaterAssessment = {
  id: string;
  district: string;
  assessment_unit: string;
  year: number;
  recharge: number;
  extraction: number;
  classification: GroundwaterClassification;
  state_code: string;
  district_code: string;
  assessment_unit_code: string;
  source_serial_number: number;
  total_geographical_area: number;
  recharge_worthy_area: number;
  recharge_from_rainfall_monsoon: number;
  recharge_from_other_sources_monsoon: number;
  recharge_from_rainfall_non_monsoon: number;
  recharge_from_other_sources_non_monsoon: number;
  total_natural_discharges: number;
  annual_extractable_groundwater_resource: number;
  irrigation_use: number;
  industrial_use: number;
  domestic_use: number;
  annual_gw_allocation_for_domestic_use_as_on_2025: number;
  net_groundwater_availability_for_future_use: number;
  stage_of_groundwater_extraction_percent: number | null;
  source_year: number;
  source_document: string;
  source_reference: string;
  created_at: string;
  updated_at: string;
};

export type DistrictSummary = {
  district: string;
  year: number | null;
  recordCount: number;
  assessmentUnitCount: number;
  totalAnnualRecharge: number;
  totalAnnualExtractableGroundwaterResource: number;
  totalGroundwaterExtraction: number;
  totalNetGroundwaterAvailability: number;
  classificationCounts: Record<GroundwaterClassification, number>;
};

export type OverallSummary = Omit<DistrictSummary, "district">;

export type DistrictComparison = {
  district: string;
  year: number | null;
  assessmentUnitCount: number;
  annualRecharge: number;
  annualExtractableResource: number;
  annualExtraction: number;
  netAvailability: number;
};

export type ClassificationSummary = {
  year: number | null;
  totalCount: number;
  classificationCounts: Record<GroundwaterClassification, number>;
};

export type TopExtractionArea = {
  district: string;
  assessmentUnit: string;
  year: number;
  extraction: number;
  recharge: number;
  classification: GroundwaterClassification;
  stageOfGroundwaterExtractionPercent: number | null;
  netGroundwaterAvailabilityForFutureUse: number;
};

const ASSESSMENT_COLUMNS = [
  "id",
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
  "source_year",
  "source_document",
  "source_reference",
  "created_at",
  "updated_at",
].join(",");

const SUMMARY_COLUMNS = [
  "district",
  "assessment_unit",
  "year",
  "recharge",
  "annual_extractable_groundwater_resource",
  "extraction",
  "net_groundwater_availability_for_future_use",
  "classification",
].join(",");

const TOP_EXTRACTION_COLUMNS = [
  "district",
  "assessment_unit",
  "year",
  "extraction",
  "recharge",
  "classification",
  "stage_of_groundwater_extraction_percent",
  "net_groundwater_availability_for_future_use",
].join(",");

type RecordValue = Record<string, unknown>;

type SummaryRow = {
  district: string;
  assessmentUnit: string;
  year: number;
  recharge: number;
  annualExtractableGroundwaterResource: number;
  extraction: number;
  netGroundwaterAvailability: number;
  classification: GroundwaterClassification;
};

function success<T>(data: T): QueryResult<T> {
  return { data, error: null };
}

function failure<T>(code: QueryErrorCode, message: string): QueryResult<T> {
  return { data: null, error: { code, message } };
}

function invalidInput(message: string): QueryResult<never> {
  return failure("INVALID_INPUT", message);
}

function databaseFailure(): QueryResult<never> {
  return failure("DATABASE_ERROR", "Unable to load groundwater data.");
}

function configurationFailure(): QueryResult<never> {
  return failure(
    "CONFIGURATION_ERROR",
    "The groundwater query service is not configured.",
  );
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readNullableNumber(value: unknown): number | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }

  return readNumber(value) ?? undefined;
}

function isClassification(value: unknown): value is GroundwaterClassification {
  return (
    typeof value === "string" &&
    (CLASSIFICATIONS as readonly string[]).includes(value)
  );
}

function readClassification(value: unknown): GroundwaterClassification | null {
  return isClassification(value) ? value : null;
}

function readRequiredNumber(
  row: RecordValue,
  key: string,
): number | null {
  return readNumber(row[key]);
}

function readRequiredString(
  row: RecordValue,
  key: string,
): string | null {
  return readString(row[key]);
}

function parseAssessment(value: unknown): GroundwaterAssessment | null {
  if (!isRecord(value)) {
    return null;
  }

  const requiredStrings = [
    "id",
    "district",
    "assessment_unit",
    "state_code",
    "district_code",
    "assessment_unit_code",
    "source_document",
    "source_reference",
    "created_at",
    "updated_at",
  ];
  const strings = Object.fromEntries(
    requiredStrings.map((key) => [key, readRequiredString(value, key)]),
  );

  if (Object.values(strings).some((item) => item === null)) {
    return null;
  }

  const requiredNumbers = [
    "year",
    "recharge",
    "extraction",
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
    "source_year",
  ];
  const numbers = Object.fromEntries(
    requiredNumbers.map((key) => [key, readRequiredNumber(value, key)]),
  );

  if (Object.values(numbers).some((item) => item === null)) {
    return null;
  }

  const classification = readClassification(value.classification);
  const stage = readNullableNumber(
    value.stage_of_groundwater_extraction_percent,
  );

  if (!classification || stage === undefined) {
    return null;
  }

  return {
    id: strings.id as string,
    district: strings.district as string,
    assessment_unit: strings.assessment_unit as string,
    year: numbers.year as number,
    recharge: numbers.recharge as number,
    extraction: numbers.extraction as number,
    classification,
    state_code: strings.state_code as string,
    district_code: strings.district_code as string,
    assessment_unit_code: strings.assessment_unit_code as string,
    source_serial_number: numbers.source_serial_number as number,
    total_geographical_area: numbers.total_geographical_area as number,
    recharge_worthy_area: numbers.recharge_worthy_area as number,
    recharge_from_rainfall_monsoon:
      numbers.recharge_from_rainfall_monsoon as number,
    recharge_from_other_sources_monsoon:
      numbers.recharge_from_other_sources_monsoon as number,
    recharge_from_rainfall_non_monsoon:
      numbers.recharge_from_rainfall_non_monsoon as number,
    recharge_from_other_sources_non_monsoon:
      numbers.recharge_from_other_sources_non_monsoon as number,
    total_natural_discharges: numbers.total_natural_discharges as number,
    annual_extractable_groundwater_resource:
      numbers.annual_extractable_groundwater_resource as number,
    irrigation_use: numbers.irrigation_use as number,
    industrial_use: numbers.industrial_use as number,
    domestic_use: numbers.domestic_use as number,
    annual_gw_allocation_for_domestic_use_as_on_2025:
      numbers.annual_gw_allocation_for_domestic_use_as_on_2025 as number,
    net_groundwater_availability_for_future_use:
      numbers.net_groundwater_availability_for_future_use as number,
    stage_of_groundwater_extraction_percent: stage,
    source_year: numbers.source_year as number,
    source_document: strings.source_document as string,
    source_reference: strings.source_reference as string,
    created_at: strings.created_at as string,
    updated_at: strings.updated_at as string,
  };
}

function parseSummaryRow(value: unknown): SummaryRow | null {
  if (!isRecord(value)) {
    return null;
  }

  const district = readString(value.district);
  const assessmentUnit = readString(value.assessment_unit);
  const year = readNumber(value.year);
  const recharge = readNumber(value.recharge);
  const annualExtractableGroundwaterResource = readNumber(
    value.annual_extractable_groundwater_resource,
  );
  const extraction = readNumber(value.extraction);
  const netGroundwaterAvailability = readNumber(
    value.net_groundwater_availability_for_future_use,
  );
  const classification = readClassification(value.classification);

  if (
    !district ||
    !assessmentUnit ||
    year === null ||
    recharge === null ||
    annualExtractableGroundwaterResource === null ||
    extraction === null ||
    netGroundwaterAvailability === null ||
    !classification
  ) {
    return null;
  }

  return {
    district,
    assessmentUnit,
    year,
    recharge,
    annualExtractableGroundwaterResource,
    extraction,
    netGroundwaterAvailability,
    classification,
  };
}

function parseTopExtractionArea(value: unknown): TopExtractionArea | null {
  if (!isRecord(value)) {
    return null;
  }

  const district = readString(value.district);
  const assessmentUnit = readString(value.assessment_unit);
  const year = readNumber(value.year);
  const extraction = readNumber(value.extraction);
  const recharge = readNumber(value.recharge);
  const classification = readClassification(value.classification);
  const stage = readNullableNumber(
    value.stage_of_groundwater_extraction_percent,
  );
  const netGroundwaterAvailability = readNumber(
    value.net_groundwater_availability_for_future_use,
  );

  if (
    !district ||
    !assessmentUnit ||
    year === null ||
    extraction === null ||
    recharge === null ||
    !classification ||
    stage === undefined ||
    netGroundwaterAvailability === null
  ) {
    return null;
  }

  return {
    district,
    assessmentUnit,
    year,
    extraction,
    recharge,
    classification,
    stageOfGroundwaterExtractionPercent: stage,
    netGroundwaterAvailabilityForFutureUse: netGroundwaterAvailability,
  };
}

function getServerClient(): QueryResult<SupabaseClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return configurationFailure();
  }

  try {
    return success(
      createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }),
    );
  } catch {
    return configurationFailure();
  }
}

function validateName(value: unknown, label: string, maxLength: number): string | QueryResult<never> {
  if (typeof value !== "string") {
    return invalidInput(`${label} must be a non-empty string.`);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength || /[\u0000-\u001f\u007f]/.test(trimmed)) {
    return invalidInput(`${label} is invalid.`);
  }

  return trimmed;
}

function validateYear(
  value: unknown,
): number | undefined | QueryResult<never> {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 9999
  ) {
    return invalidInput("year must be an integer between 1 and 9999.");
  }

  return value;
}

function validateLimit(value: unknown): number | QueryResult<never> {
  if (value === undefined) {
    return DEFAULT_TOP_LIMIT;
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_TOP_LIMIT
  ) {
    return invalidInput(
      `limit must be an integer between 1 and ${MAX_TOP_LIMIT}.`,
    );
  }

  return value;
}

function isQueryError(value: unknown): value is QueryResult<never> {
  return isRecord(value) && "error" in value && value.error !== null;
}

function emptyClassificationCounts(): Record<GroundwaterClassification, number> {
  return {
    critical: 0,
    over_exploited: 0,
    safe: 0,
    salinity: 0,
    semi_critical: 0,
  };
}

function emptyDistrictSummary(
  district: string,
  year: number | undefined,
): DistrictSummary {
  return {
    district,
    year: year ?? null,
    recordCount: 0,
    assessmentUnitCount: 0,
    totalAnnualRecharge: 0,
    totalAnnualExtractableGroundwaterResource: 0,
    totalGroundwaterExtraction: 0,
    totalNetGroundwaterAvailability: 0,
    classificationCounts: emptyClassificationCounts(),
  };
}

function emptyOverallSummary(year: number | undefined): OverallSummary {
  return {
    year: year ?? null,
    recordCount: 0,
    assessmentUnitCount: 0,
    totalAnnualRecharge: 0,
    totalAnnualExtractableGroundwaterResource: 0,
    totalGroundwaterExtraction: 0,
    totalNetGroundwaterAvailability: 0,
    classificationCounts: emptyClassificationCounts(),
  };
}

function emptyDistrictComparison(
  district: string,
  year: number | undefined,
): DistrictComparison {
  return {
    district,
    year: year ?? null,
    assessmentUnitCount: 0,
    annualRecharge: 0,
    annualExtractableResource: 0,
    annualExtraction: 0,
    netAvailability: 0,
  };
}

/** Return the unique database district names in stable alphabetical order. */
export async function getDistricts(): Promise<QueryResult<string[]>> {
  const clientResult = getServerClient();
  if (clientResult.error) {
    return clientResult;
  }

  try {
    const { data, error } = await clientResult.data
      .from(TABLE_NAME)
      .select("district")
      .order("district", { ascending: true });

    if (error || !data) {
      return databaseFailure();
    }

    const districts = new Set<string>();
    for (const row of data) {
      if (!isRecord(row) || typeof row.district !== "string") {
        return databaseFailure();
      }
      districts.add(row.district);
    }

    return success([...districts].sort((left, right) => left.localeCompare(right)));
  } catch {
    return databaseFailure();
  }
}

export type AssessmentLocation = { district: string; assessmentUnit: string };

/** Names only, for conservative conversational entity resolution. No measurements are cached. */
export async function getAssessmentLocations(): Promise<QueryResult<AssessmentLocation[]>> {
  const clientResult = getServerClient();
  if (clientResult.error) return clientResult;
  try {
    const locations: AssessmentLocation[] = [];
    for (let start = 0; ; start += 1000) {
      const { data, error } = await clientResult.data.from(TABLE_NAME)
        .select("district,assessment_unit").eq("year", 2024)
        .order("district").order("assessment_unit").range(start, start + 999);
      if (error || !data) return databaseFailure();
      for (const row of data) {
        if (typeof row.district !== "string" || typeof row.assessment_unit !== "string") return databaseFailure();
        locations.push({ district: row.district, assessmentUnit: row.assessment_unit });
      }
      if (data.length < 1000) break;
    }
    return success(locations);
  } catch { return databaseFailure(); }
}

/** Return unique assessment-unit names, optionally restricted to one district. */
export async function getAssessmentUnits(
  district?: string,
): Promise<QueryResult<string[]>> {
  const validatedDistrict =
    district === undefined ? undefined : validateName(district, "district", 120);
  if (isQueryError(validatedDistrict)) {
    return validatedDistrict;
  }

  const clientResult = getServerClient();
  if (clientResult.error) {
    return clientResult;
  }

  try {
    let query = clientResult.data
      .from(TABLE_NAME)
      .select("assessment_unit,district")
      .order("assessment_unit", { ascending: true });

    if (validatedDistrict) {
      query = query.eq("district", validatedDistrict);
    }

    const { data, error } = await query;
    if (error || !data) {
      return databaseFailure();
    }

    const assessmentUnits = new Set<string>();
    for (const row of data) {
      if (!isRecord(row) || typeof row.assessment_unit !== "string") {
        return databaseFailure();
      }
      assessmentUnits.add(row.assessment_unit);
    }

    return success(
      [...assessmentUnits].sort((left, right) => left.localeCompare(right)),
    );
  } catch {
    return databaseFailure();
  }
}

/** Return one complete assessment; without year, the latest available year is used. */
export async function getAssessment(
  district: string,
  assessmentUnit: string,
  year?: number,
): Promise<QueryResult<GroundwaterAssessment>> {
  const validatedDistrict = validateName(district, "district", 120);
  if (isQueryError(validatedDistrict)) {
    return validatedDistrict;
  }

  const validatedAssessmentUnit = validateName(
    assessmentUnit,
    "assessmentUnit",
    160,
  );
  if (isQueryError(validatedAssessmentUnit)) {
    return validatedAssessmentUnit;
  }

  const validatedYear = validateYear(year);
  if (isQueryError(validatedYear)) {
    return validatedYear;
  }

  const clientResult = getServerClient();
  if (clientResult.error) {
    return clientResult;
  }

  try {
    let query = clientResult.data
      .from(TABLE_NAME)
      .select(ASSESSMENT_COLUMNS)
      .eq("district", validatedDistrict)
      .eq("assessment_unit", validatedAssessmentUnit)
      .order("year", { ascending: false })
      .limit(1);

    if (validatedYear !== undefined) {
      query = query.eq("year", validatedYear);
    }

    const { data, error } = await query;
    if (error) {
      return databaseFailure();
    }

    const assessment = data?.[0] ? parseAssessment(data[0]) : null;
    if (!assessment) {
      return failure("NOT_FOUND", "Assessment not found.");
    }

    return success(assessment);
  } catch {
    return databaseFailure();
  }
}

/** Aggregate stored source fields for a district and optional year. */
export async function getDistrictSummary(
  district: string,
  year?: number,
): Promise<QueryResult<DistrictSummary>> {
  const validatedDistrict = validateName(district, "district", 120);
  if (isQueryError(validatedDistrict)) {
    return validatedDistrict;
  }

  const validatedYear = validateYear(year);
  if (isQueryError(validatedYear)) {
    return validatedYear;
  }

  const clientResult = getServerClient();
  if (clientResult.error) {
    return clientResult;
  }

  try {
    let query = clientResult.data
      .from(TABLE_NAME)
      .select(SUMMARY_COLUMNS)
      .eq("district", validatedDistrict);

    if (validatedYear !== undefined) {
      query = query.eq("year", validatedYear);
    }

    const { data, error } = await query;
    if (error || !data) {
      return databaseFailure();
    }

    const rows: SummaryRow[] = [];
    for (const row of data) {
      const parsed = parseSummaryRow(row);
      if (!parsed) {
        return databaseFailure();
      }
      rows.push(parsed);
    }

    const summary = emptyDistrictSummary(validatedDistrict, validatedYear);
    const assessmentUnits = new Set<string>();
    for (const row of rows) {
      assessmentUnits.add(row.assessmentUnit);
      summary.totalAnnualRecharge += row.recharge;
      summary.totalAnnualExtractableGroundwaterResource +=
        row.annualExtractableGroundwaterResource;
      summary.totalGroundwaterExtraction += row.extraction;
      summary.totalNetGroundwaterAvailability +=
        row.netGroundwaterAvailability;
      summary.classificationCounts[row.classification] += 1;
    }

    summary.recordCount = rows.length;
    summary.assessmentUnitCount = assessmentUnits.size;
    return success(summary);
  } catch {
    return databaseFailure();
  }
}

/** Aggregate stored source fields across all records for an optional year. */
export async function getOverallSummary(
  year?: number,
): Promise<QueryResult<OverallSummary>> {
  const validatedYear = validateYear(year);
  if (isQueryError(validatedYear)) {
    return validatedYear;
  }

  const clientResult = getServerClient();
  if (clientResult.error) {
    return clientResult;
  }

  try {
    let query = clientResult.data.from(TABLE_NAME).select(SUMMARY_COLUMNS);

    if (validatedYear !== undefined) {
      query = query.eq("year", validatedYear);
    }

    const { data, error } = await query;
    if (error || !data) {
      return databaseFailure();
    }

    const summary = emptyOverallSummary(validatedYear);
    const assessmentUnits = new Set<string>();

    for (const row of data) {
      const parsed = parseSummaryRow(row);
      if (!parsed) {
        return databaseFailure();
      }

      assessmentUnits.add(parsed.assessmentUnit);
      summary.totalAnnualRecharge += parsed.recharge;
      summary.totalAnnualExtractableGroundwaterResource +=
        parsed.annualExtractableGroundwaterResource;
      summary.totalGroundwaterExtraction += parsed.extraction;
      summary.totalNetGroundwaterAvailability +=
        parsed.netGroundwaterAvailability;
      summary.classificationCounts[parsed.classification] += 1;
    }

    summary.recordCount = data.length;
    summary.assessmentUnitCount = assessmentUnits.size;
    return success(summary);
  } catch {
    return databaseFailure();
  }
}

/** Aggregate stored resource fields by district for map and comparison views. */
export async function getDistrictComparison(
  year?: number,
): Promise<QueryResult<DistrictComparison[]>> {
  const validatedYear = validateYear(year);
  if (isQueryError(validatedYear)) {
    return validatedYear;
  }

  const clientResult = getServerClient();
  if (clientResult.error) {
    return clientResult;
  }

  try {
    let query = clientResult.data
      .from(TABLE_NAME)
      .select(SUMMARY_COLUMNS)
      .order("district", { ascending: true })
      .order("assessment_unit", { ascending: true });

    if (validatedYear !== undefined) {
      query = query.eq("year", validatedYear);
    }

    const { data, error } = await query;
    if (error || !data) {
      return databaseFailure();
    }

    const summaries = new Map<string, DistrictComparison>();
    const assessmentUnits = new Map<string, Set<string>>();

    for (const row of data) {
      const parsed = parseSummaryRow(row);
      if (!parsed) {
        return databaseFailure();
      }

      const summary =
        summaries.get(parsed.district) ??
        emptyDistrictComparison(parsed.district, validatedYear);
      const units = assessmentUnits.get(parsed.district) ?? new Set<string>();

      units.add(parsed.assessmentUnit);
      summary.annualRecharge += parsed.recharge;
      summary.annualExtractableResource +=
        parsed.annualExtractableGroundwaterResource;
      summary.annualExtraction += parsed.extraction;
      summary.netAvailability += parsed.netGroundwaterAvailability;
      summary.assessmentUnitCount = units.size;
      summaries.set(parsed.district, summary);
      assessmentUnits.set(parsed.district, units);
    }

    return success([...summaries.values()]);
  } catch {
    return databaseFailure();
  }
}

/** Count the five stored classification values for an optional year. */
export async function getClassificationSummary(
  year?: number,
): Promise<QueryResult<ClassificationSummary>> {
  const validatedYear = validateYear(year);
  if (isQueryError(validatedYear)) {
    return validatedYear;
  }

  const clientResult = getServerClient();
  if (clientResult.error) {
    return clientResult;
  }

  try {
    let query = clientResult.data
      .from(TABLE_NAME)
      .select("classification,year");

    if (validatedYear !== undefined) {
      query = query.eq("year", validatedYear);
    }

    const { data, error } = await query;
    if (error || !data) {
      return databaseFailure();
    }

    const classificationCounts = emptyClassificationCounts();
    for (const row of data) {
      if (!isRecord(row) || !isClassification(row.classification)) {
        return databaseFailure();
      }
      classificationCounts[row.classification] += 1;
    }

    return success({
      year: validatedYear ?? null,
      totalCount: data.length,
      classificationCounts,
    });
  } catch {
    return databaseFailure();
  }
}

/** Return extraction-ordered areas; this is not a risk ranking. */
export async function getTopExtractionAreas(
  year?: number,
  limit?: number,
  district?: string,
): Promise<QueryResult<TopExtractionArea[]>> {
  const validatedYear = validateYear(year);
  if (isQueryError(validatedYear)) {
    return validatedYear;
  }

  const validatedLimit = validateLimit(limit);
  if (isQueryError(validatedLimit)) {
    return validatedLimit;
  }

  const validatedDistrict =
    district === undefined ? undefined : validateName(district, "district", 120);
  if (isQueryError(validatedDistrict)) {
    return validatedDistrict;
  }

  const clientResult = getServerClient();
  if (clientResult.error) {
    return clientResult;
  }

  try {
    let query = clientResult.data
      .from(TABLE_NAME)
      .select(TOP_EXTRACTION_COLUMNS)
      .order("extraction", { ascending: false })
      .order("district", { ascending: true })
      .order("assessment_unit", { ascending: true })
      .order("year", { ascending: false })
      .limit(validatedLimit);

    if (validatedYear !== undefined) {
      query = query.eq("year", validatedYear);
    }
    if (validatedDistrict !== undefined) {
      query = query.eq("district", validatedDistrict);
    }

    const { data, error } = await query;
    if (error || !data) {
      return databaseFailure();
    }

    const areas: TopExtractionArea[] = [];
    for (const row of data) {
      const parsed = parseTopExtractionArea(row);
      if (!parsed) {
        return databaseFailure();
      }
      areas.push(parsed);
    }

    return success(areas);
  } catch {
    return databaseFailure();
  }
}
