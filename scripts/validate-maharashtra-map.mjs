import { readFile } from "node:fs/promises";

const filePath = "public/maps/maharashtra-districts.geojson";
const expectedDistricts = new Set([
  "Ahmednagar",
  "Akola",
  "Amravati",
  "Aurangabad",
  "Beed",
  "Bhandara",
  "Buldhana",
  "Chandrapur",
  "Dhule",
  "Gadchiroli",
  "Gondia",
  "Hingoli",
  "Jalgaon",
  "Jalna",
  "Kolhapur",
  "Latur",
  "Mumbai",
  "Mumbai Sub",
  "Nagpur",
  "Nanded",
  "Nandurbar",
  "Nashik",
  "Osmanabad",
  "Palghar",
  "Parbhani",
  "Pune",
  "Raigad",
  "Ratnagiri",
  "Sangli",
  "Satara",
  "Sindhudurg",
  "Solapur",
  "Thane",
  "Wardha",
  "Washim",
  "Yawatmal",
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const value = JSON.parse(await readFile(filePath, "utf8"));
assert(value.type === "FeatureCollection", "map asset must be a FeatureCollection");
assert(value.metadata?.coordinateReferenceSystem === "WGS 84 / EPSG:4326", "map CRS must be EPSG:4326");
assert(typeof value.metadata?.source === "string", "map source metadata is required");
assert(Array.isArray(value.features), "map features must be an array");
assert(value.features.length === 36, "map must contain 36 Maharashtra features");

const districts = value.features.map((feature) => feature.properties?.district);
assert(districts.every((district) => typeof district === "string"), "every feature needs a district property");
assert(new Set(districts).size === 36, "map district names must be unique");
assert(
  districts.every((district) => expectedDistricts.has(district)),
  "map district names must match the normalized groundwater dataset",
);

for (const feature of value.features) {
  assert(feature.geometry, `missing geometry for ${feature.properties.district}`);
  assert(
    typeof feature.properties.sourceDistrictName === "string",
    `missing source name for ${feature.properties.district}`,
  );
}

console.log(`Maharashtra map validation passed: ${value.features.length} unique districts.`);
