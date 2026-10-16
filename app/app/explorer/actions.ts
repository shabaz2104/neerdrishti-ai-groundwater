"use server";

import {
  getAssessment,
  getAssessmentUnits,
  type GroundwaterAssessment,
  type QueryResult,
} from "@/lib/groundwater-queries.server";
import { getCurrentUser } from "@/lib/auth.server";

export type ExplorerAssessment = Pick<
  GroundwaterAssessment,
  | "district"
  | "assessment_unit"
  | "year"
  | "classification"
  | "recharge"
  | "annual_extractable_groundwater_resource"
  | "extraction"
  | "net_groundwater_availability_for_future_use"
  | "stage_of_groundwater_extraction_percent"
>;

export async function loadExplorerAssessmentUnits(
  district: string,
): Promise<QueryResult<string[]>> {
  if (!(await getCurrentUser())) throw new Error("Authentication required.");
  return getAssessmentUnits(district);
}

export async function loadExplorerAssessment(
  district: string,
  assessmentUnit: string,
  year: number,
): Promise<QueryResult<ExplorerAssessment>> {
  if (!(await getCurrentUser())) throw new Error("Authentication required.");
  if (year !== 2024) {
    return { data: null, error: { code: "INVALID_INPUT", message: "Only assessment year 2024 is supported." } };
  }
  const result = await getAssessment(district, assessmentUnit, year);

  if (result.error) {
    return result;
  }

  return {
    data: {
      district: result.data.district,
      assessment_unit: result.data.assessment_unit,
      year: result.data.year,
      classification: result.data.classification,
      recharge: result.data.recharge,
      annual_extractable_groundwater_resource:
        result.data.annual_extractable_groundwater_resource,
      extraction: result.data.extraction,
      net_groundwater_availability_for_future_use:
        result.data.net_groundwater_availability_for_future_use,
      stage_of_groundwater_extraction_percent:
        result.data.stage_of_groundwater_extraction_percent,
    },
    error: null,
  };
}
