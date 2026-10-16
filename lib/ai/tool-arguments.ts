export const APPROVED_GROUNDWATER_TOOL_NAMES = [
  "getDistricts",
  "getAssessmentUnits",
  "getAssessment",
  "getDistrictSummary",
  "getClassificationSummary",
  "getTopExtractionAreas",
  "getOverallSummary",
  "getDistrictComparison",
] as const;

export type ApprovedGroundwaterToolName =
  (typeof APPROVED_GROUNDWATER_TOOL_NAMES)[number];

type PlainArguments = Record<string, unknown>;

export const GROUNDWATER_TOPICS = ["summary", "classification", "extraction", "recharge"] as const;
export const GROUNDWATER_CATEGORIES = ["safe", "semi_critical", "critical", "over_exploited", "salinity"] as const;

function validFocus(args: PlainArguments) {
  return (args.topic === undefined || GROUNDWATER_TOPICS.includes(args.topic as (typeof GROUNDWATER_TOPICS)[number])) &&
    (args.proposedClassification === undefined || (args.topic === "classification" && GROUNDWATER_CATEGORIES.includes(args.proposedClassification as (typeof GROUNDWATER_CATEGORIES)[number])));
}

export type ToolArgumentsValidation =
  | PlainArguments
  | {
      error: string;
    };

function isPlainArguments(value: unknown): value is PlainArguments {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseArguments(value: unknown): PlainArguments | null {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return isPlainArguments(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isPlainArguments(value) ? value : null;
}

function hasOnlyKeys(value: PlainArguments, keys: readonly string[]) {
  return Object.keys(value).every((key) => keys.includes(key));
}

function readOptionalYear(value: unknown): number | undefined | null {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 9999
    ? value
    : null;
}

function readRequiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function validateToolArguments(
  toolName: string,
  rawArguments: unknown,
): ToolArgumentsValidation {
  const args = parseArguments(rawArguments);
  if (!args) {
    return { error: "Tool arguments must be a JSON object." };
  }

  if (!APPROVED_GROUNDWATER_TOOL_NAMES.includes(toolName as ApprovedGroundwaterToolName)) {
    return { error: "The requested tool is not approved." };
  }

  const year = readOptionalYear(args.year);
  if (year === null) {
    return { error: "year must be an integer between 1 and 9999." };
  }

  switch (toolName) {
    case "getDistricts":
      return hasOnlyKeys(args, [])
        ? args
        : { error: "getDistricts does not accept arguments." };
    case "getAssessmentUnits":
      if (!hasOnlyKeys(args, ["district"])) {
        return { error: "getAssessmentUnits received an unsupported argument." };
      }
      if (args.district !== undefined && readRequiredString(args.district) === null) {
        return { error: "district must be a non-empty string." };
      }
      return args;
    case "getAssessment":
      if (!hasOnlyKeys(args, ["district", "assessmentUnit", "year", "topic", "proposedClassification"])) {
        return { error: "getAssessment received an unsupported argument." };
      }
      if (readRequiredString(args.district) === null || readRequiredString(args.assessmentUnit) === null) {
        return { error: "district and assessmentUnit must be non-empty strings." };
      }
      if (!validFocus(args)) return { error: "Invalid groundwater topic or proposed classification." };
      return args;
    case "getDistrictSummary":
      if (!hasOnlyKeys(args, ["district", "year", "topic", "proposedClassification"])) {
        return { error: "getDistrictSummary received an unsupported argument." };
      }
      if (readRequiredString(args.district) === null) {
        return { error: "district must be a non-empty string." };
      }
      if (!validFocus(args)) return { error: "Invalid groundwater topic or proposed classification." };
      return args;
    case "getClassificationSummary":
      return hasOnlyKeys(args, ["year"])
        ? args
        : { error: "getClassificationSummary received an unsupported argument." };
    case "getTopExtractionAreas":
      if (!hasOnlyKeys(args, ["year", "limit", "district"])) {
        return { error: "getTopExtractionAreas received an unsupported argument." };
      }
      if (args.district !== undefined && readRequiredString(args.district) === null) {
        return { error: "district must be a non-empty string." };
      }
      if (
        args.limit !== undefined &&
        (typeof args.limit !== "number" || !Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100)
      ) {
        return { error: "limit must be an integer between 1 and 100." };
      }
      return args;
    case "getOverallSummary":
      return hasOnlyKeys(args, ["year"])
        ? args
        : { error: "getOverallSummary received an unsupported argument." };
    case "getDistrictComparison":
      return hasOnlyKeys(args, ["year"])
        ? args
        : { error: "getDistrictComparison received an unsupported argument." };
    default:
      return { error: "The requested tool is not approved." };
  }
}
