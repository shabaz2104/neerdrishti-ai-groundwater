import type { DistrictGeoJson } from "./map-types";

// Only this public, static geometry is shared for the lifetime of the document.
// Never cache measurements, auth, roles or user-specific results here.
let boundaries: Promise<DistrictGeoJson> | undefined;

export function loadDistrictBoundaries(): Promise<DistrictGeoJson> {
  boundaries ??= fetch("/maps/maharashtra-districts.geojson")
    .then(async (response) => {
      if (!response.ok) throw new Error("Boundary request failed");
      const data = await response.json() as DistrictGeoJson;
      if (data?.type !== "FeatureCollection" || !Array.isArray(data.features) || data.features.length !== 36) throw new Error("Boundary data is incomplete");
      return data;
    })
    .catch((error: unknown) => { boundaries = undefined; throw error; });
  return boundaries;
}
