import type { GroundwaterIntent } from "./groundwater-intent.ts";

export const MAX_ANSWER_CONTEXT_CHARS = 16_000;
const INTERNAL_FIELDS = new Set(["id", "state_code", "district_code", "assessment_unit_code", "source_serial_number", "source_year", "source_document", "source_reference", "created_at", "updated_at"]);

/** The executor already scopes each result; remove record bookkeeping only.
 * Keep all water metrics (including nulls) so detailed questions remain grounded.
 * No transcript, catalog, credentials or unrelated dataset is included here.
 */
export function buildGroundwaterAnswerContext(question: string, intent: GroundwaterIntent, result: unknown): string | null {
  const data = intent.action === "getAssessment" && result && typeof result === "object" && !Array.isArray(result)
    ? Object.fromEntries(Object.entries(result).filter(([key]) => !INTERNAL_FIELDS.has(key)))
    : result;
  try {
    const context = JSON.stringify({ question, action: intent.action, arguments: intent.arguments, result: data });
    return context.length <= MAX_ANSWER_CONTEXT_CHARS ? context : null;
  } catch { return null; }
}
