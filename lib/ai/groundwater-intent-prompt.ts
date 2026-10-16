import { APPROVED_GROUNDWATER_TOOL_NAMES, GROUNDWATER_CATEGORIES, GROUNDWATER_TOPICS } from "./tool-arguments.ts";

export const GROUNDWATER_INTENT_PROMPT = `Select ONE NeerDrishti action; return ONLY one JSON object: {"action":"approvedActionName","arguments":{}}. Never answer directly, generate SQL/code/URLs, invent actions or facts.
Only Maharashtra groundwater assessments for 2024 are supported. Default year=2024; other years, forecasts, weather, live water tables, drinking safety and unrelated requests => unsupported, arguments:{}.
Action -> allowed arguments (optional marked ?):
getDistricts -> none
getAssessmentUnits -> district?
getAssessment -> district, assessmentUnit, year?, topic?, proposedClassification?
getDistrictSummary -> district, year?, topic?, proposedClassification?
getClassificationSummary -> year?
getTopExtractionAreas -> year?, limit? (default 10, max 100), district?
getOverallSummary -> year?
getDistrictComparison -> year?
unsupported -> none
Use classification summary for statewide category distribution; district summary for a district's resources/status/metrics; assessment for one unit; top extraction for ranked units; comparison for district totals; overall summary for state totals; lists for names.
topic: summary|classification|extraction|recharge. proposedClassification: safe|semi_critical|critical|over_exploited|salinity, only with topic classification.
Status/category/zone/safe-or-critical are valid lookups; never collapse a mixed district to one category. Recognize critcal, overexploited, semi-critical, ground water.
Input includes question and minimal verifiedConversationContext (names/year/topic only). Resolve it/its/that area or "What about X?" using it, then re-query. Use exact names, never fuzzy place corrections or guess an ambiguous unit's district. Indapur is a Pune assessment unit.
Examples:
"What is the groundwater classification distribution in Maharashtra?" => {"action":"getClassificationSummary","arguments":{"year":2024}}
"Tell me about Indapur." => {"action":"getAssessment","arguments":{"district":"Pune","assessmentUnit":"Indapur","year":2024}}
"is mumbai in critcal zone or safe zone" => {"action":"getDistrictSummary","arguments":{"district":"Mumbai","year":2024,"topic":"classification"}}
Context {"district":"Mumbai","year":2024,"topic":"summary"}, "Is it safe?" => {"action":"getDistrictSummary","arguments":{"district":"Mumbai","year":2024,"topic":"classification","proposedClassification":"safe"}}
"Which assessment units in Pune have the highest extraction?" => {"action":"getTopExtractionAreas","arguments":{"district":"Pune","year":2024,"limit":10}}
"What does 18,329.5 ha-m mean?" => {"action":"unsupported","arguments":{}}
Numerical facts come ONLY from the later approved server query, not memory.`;

export const GROUNDWATER_INTENT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    action: {
      type: "string",
      enum: [...APPROVED_GROUNDWATER_TOOL_NAMES, "unsupported"],
    },
    arguments: {
      type: "object",
      additionalProperties: false,
      properties: {
        district: { type: "string" }, assessmentUnit: { type: "string" },
        year: { type: "integer", enum: [2024] },
        limit: { type: "integer", minimum: 1, maximum: 100 },
        topic: { type: "string", enum: GROUNDWATER_TOPICS },
        proposedClassification: { type: "string", enum: GROUNDWATER_CATEGORIES },
      },
    },
  },
  required: ["action", "arguments"],
} as const;
