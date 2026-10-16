import {
  APPROVED_GROUNDWATER_TOOL_NAMES,
  validateToolArguments,
  type ApprovedGroundwaterToolName,
} from "./tool-arguments.ts";

export type GroundwaterIntentAction = ApprovedGroundwaterToolName | "unsupported";

export type GroundwaterIntent = {
  action: GroundwaterIntentAction;
  arguments: Record<string, unknown>;
};

export type GroundwaterIntentValidation =
  | { ok: true; intent: GroundwaterIntent }
  | {
      ok: false;
      code: "INVALID_AI_INTENT" | "UNSUPPORTED_YEAR" | "UNSUPPORTED_INTENT";
      message: string;
    };

const YEAR_ACTIONS = new Set<ApprovedGroundwaterToolName>([
  "getAssessment",
  "getDistrictSummary",
  "getClassificationSummary",
  "getTopExtractionAreas",
  "getOverallSummary",
  "getDistrictComparison",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(value: string): unknown {
  const trimmed = value.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return JSON.parse(fenced?.[1] ?? trimmed);
}

function normalizeArguments(
  action: ApprovedGroundwaterToolName,
  argumentsValue: Record<string, unknown>,
) {
  const normalized = { ...argumentsValue };
  if (YEAR_ACTIONS.has(action) && normalized.year === undefined) {
    normalized.year = 2024;
  }
  return normalized;
}

export function parseGroundwaterIntent(value: string): GroundwaterIntentValidation {
  let parsed: unknown;
  try {
    parsed = parseJson(value);
  } catch {
    return {
      ok: false,
      code: "INVALID_AI_INTENT",
      message: "The AI service returned malformed intent JSON.",
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      code: "INVALID_AI_INTENT",
      message: "The AI service intent must be a JSON object.",
    };
  }

  const keys = Object.keys(parsed);
  if (keys.length !== 2 || !keys.includes("action") || !keys.includes("arguments")) {
    return {
      ok: false,
      code: "INVALID_AI_INTENT",
      message: "The AI service intent has an unsupported shape.",
    };
  }

  if (typeof parsed.action !== "string" || !isRecord(parsed.arguments)) {
    return {
      ok: false,
      code: "INVALID_AI_INTENT",
      message: "The AI service intent has invalid action arguments.",
    };
  }

  const action = parsed.action as GroundwaterIntentAction;
  if (action === "unsupported") {
    if (Object.keys(parsed.arguments).length !== 0) {
      return {
        ok: false,
        code: "INVALID_AI_INTENT",
        message: "An unsupported intent cannot contain arguments.",
      };
    }
    return {
      ok: false,
      code: "UNSUPPORTED_INTENT",
      message: "I can help with NeerDrishti's Maharashtra groundwater data, but that request does not map to a supported groundwater lookup.",
    };
  }

  if (!APPROVED_GROUNDWATER_TOOL_NAMES.includes(action)) {
    return {
      ok: false,
      code: "INVALID_AI_INTENT",
      message: "The AI service selected an unapproved action.",
    };
  }

  const normalizedArguments = normalizeArguments(action, parsed.arguments);
  if (normalizedArguments.year !== undefined && normalizedArguments.year !== 2024) {
    return {
      ok: false,
      code: "UNSUPPORTED_YEAR",
      message: "The current structured NeerDrishti dataset only supports assessment year 2024.",
    };
  }
  const validatedArguments = validateToolArguments(action, normalizedArguments);
  if ("error" in validatedArguments) {
    const unsupportedYear =
      normalizedArguments.year !== undefined && normalizedArguments.year !== 2024;
    return {
      ok: false,
      code: unsupportedYear ? "UNSUPPORTED_YEAR" : "INVALID_AI_INTENT",
      message: unsupportedYear
        ? "The current structured NeerDrishti dataset only supports assessment year 2024."
        : "The AI service returned invalid arguments for the selected groundwater action.",
    };
  }

  return {
    ok: true,
    intent: {
      action,
      arguments: validatedArguments,
    },
  };
}
