import type { FeatureCollection, Geometry } from "geojson";

export type DistrictComparison = {
  district: string;
  year: number | null;
  assessmentUnitCount: number;
  annualRecharge: number;
  annualExtractableResource: number;
  annualExtraction: number;
  netAvailability: number;
};

export type MapMetric =
  | "annualExtraction"
  | "annualRecharge"
  | "annualExtractableResource"
  | "netAvailability";

export type DistrictGeoJsonProperties = {
  district: string;
  sourceDistrictName: string;
  sourceDistrictCode: string | null;
  sourceStateCode: string | null;
  sourceYear: string | null;
};

export type DistrictGeoJson = FeatureCollection<
  Geometry,
  DistrictGeoJsonProperties
>;
