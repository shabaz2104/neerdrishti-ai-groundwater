import { mkdir, readFile, writeFile } from "node:fs/promises";

const SOURCE_URL =
  "https://mapservice.gov.in/gismapservice/rest/services/BharatMapService/Admin_Boundary_District/MapServer/1/query?where=stname%3D%27Maharashtra%27&outFields=dtname%2Cstname%2Cstcode11%2Cdtcode11%2Cyear_stat%2Cdist_lgd%2Cstate_lgd%2CNew_Name&returnGeometry=true&outSR=4326&geometryPrecision=4&f=geojson";
const OUTPUT_PATH = "public/maps/maharashtra-districts.geojson";

const SOURCE_TO_DATABASE_DISTRICT = {
  Ahilyanagar: "Ahmednagar",
  "Chhatrapati Sambhajinagar": "Aurangabad",
  Dharashiv: "Osmanabad",
  "Mumbai Suburban": "Mumbai Sub",
  Yavatmal: "Yawatmal",
};

const DATABASE_DISTRICTS = new Set([
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

let source;
if (process.argv[2]) {
  source = JSON.parse(await readFile(process.argv[2], "utf8"));
} else {
  const response = await fetch(SOURCE_URL, {
    headers: { "user-agent": "NeerDrishti/1.0" },
  });

  if (!response.ok) {
    throw new Error(`District service returned HTTP ${response.status}.`);
  }

  source = await response.json();
}
if (source?.type !== "FeatureCollection" || !Array.isArray(source.features)) {
  throw new Error("District service did not return a GeoJSON FeatureCollection.");
}

const features = source.features.map((feature) => {
  const sourceName = feature?.properties?.dtname;
  const stateName = feature?.properties?.stname;

  if (typeof sourceName !== "string" || stateName !== "Maharashtra") {
    throw new Error("District feature is missing the expected Maharashtra name.");
  }

  const district = SOURCE_TO_DATABASE_DISTRICT[sourceName] ?? sourceName;
  if (!DATABASE_DISTRICTS.has(district)) {
    throw new Error(`No explicit database match exists for source district ${sourceName}.`);
  }

  return {
    ...feature,
    properties: {
      district,
      sourceDistrictName: sourceName,
      sourceDistrictCode: feature.properties.dtcode11 ?? null,
      sourceStateCode: feature.properties.stcode11 ?? null,
      sourceYear: feature.properties.year_stat ?? null,
    },
  };
});

if (features.length !== DATABASE_DISTRICTS.size) {
  throw new Error(
    `Expected ${DATABASE_DISTRICTS.size} Maharashtra districts, received ${features.length}.`,
  );
}

const matchedDistricts = new Set(features.map((feature) => feature.properties.district));
if (matchedDistricts.size !== DATABASE_DISTRICTS.size) {
  throw new Error("Normalized district names are not unique.");
}

await mkdir("public/maps", { recursive: true });
await writeFile(
  OUTPUT_PATH,
  `${JSON.stringify(
    {
      type: "FeatureCollection",
      metadata: {
        source: SOURCE_URL,
        retrievedOn: "2026-09-23",
        coordinateReferenceSystem: "WGS 84 / EPSG:4326",
        districtNameProperty: "district",
      },
      features,
    },
  )}\n`,
  "utf8",
);

console.log(`Wrote ${features.length} district features to ${OUTPUT_PATH}.`);
