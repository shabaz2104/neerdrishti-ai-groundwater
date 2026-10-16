import type { GroundwaterAssessment, GroundwaterClassification } from "@/lib/groundwater-queries.server";

export const ADMIN_CLASSIFICATIONS = [
  "critical",
  "over_exploited",
  "safe",
  "salinity",
  "semi_critical",
] as const satisfies readonly GroundwaterClassification[];

export type AdminGroundwaterRecord = Pick<GroundwaterAssessment,
  | "id" | "district" | "assessment_unit" | "year" | "classification"
  | "recharge" | "annual_extractable_groundwater_resource" | "extraction"
  | "net_groundwater_availability_for_future_use"
  | "stage_of_groundwater_extraction_percent" | "updated_at"
>;

export type AdminGroundwaterDetail = GroundwaterAssessment;
