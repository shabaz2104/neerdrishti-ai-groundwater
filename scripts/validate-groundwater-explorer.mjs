import assert from "node:assert/strict";
import "./ai-test-runtime.mjs";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  const absolutePath = resolve(root, relativePath);
  assert.ok(existsSync(absolutePath), `missing file: ${relativePath}`);
  return readFileSync(absolutePath, "utf8");
}

const explorerSource = read("app/app/explorer/explorer.tsx");
const actionsSource = read("app/app/explorer/actions.ts");
const queryLayerSource = read("lib/groundwater-queries.server.ts");
const queryLayer = await import("../lib/groundwater-queries.server.ts");

assert.match(explorerSource, /loadExplorerAssessmentUnits/);
assert.match(explorerSource, /loadExplorerAssessment/);
assert.match(explorerSource, /URLSearchParams/);
assert.match(explorerSource, /Not available/);
assert.match(explorerSource, /No assessment units found for this district/);
assert.match(explorerSource, /No groundwater assessment was found/);
assert.match(explorerSource, /2024/);
assert.doesNotMatch(explorerSource, /SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(explorerSource, /groundwater-queries\.server/);
assert.match(actionsSource, /getAssessmentUnits/);
assert.match(actionsSource, /getAssessment/);
assert.doesNotMatch(explorerSource, /select\(\s*["'`]\*/);
assert.match(queryLayerSource, /\.eq\("district", validatedDistrict\)/);
assert.match(queryLayerSource, /\.eq\("assessment_unit", validatedAssessmentUnit\)/);

const districtResult = await queryLayer.getDistricts();
assert.equal(districtResult.error, null);
assert.equal(districtResult.data.length, 36);

const knownDistrict = districtResult.data[0];
assert.ok(knownDistrict);
const unitsResult = await queryLayer.getAssessmentUnits(knownDistrict);
assert.equal(unitsResult.error, null);
assert.ok(unitsResult.data.length > 0);

const assessmentResult = await queryLayer.getAssessment(
  knownDistrict,
  unitsResult.data[0],
  2024,
);
assert.equal(assessmentResult.error, null);
assert.equal(assessmentResult.data?.district, knownDistrict);
assert.equal(assessmentResult.data?.year, 2024);
assert.ok(
  assessmentResult.data?.stage_of_groundwater_extraction_percent === null ||
    typeof assessmentResult.data?.stage_of_groundwater_extraction_percent === "number",
);

console.log("Groundwater Explorer validation passed.");
console.log(`  districts exposed by query layer: ${districtResult.data.length}`);
console.log(`  filtered units for ${knownDistrict}: ${unitsResult.data.length}`);
console.log("  2024 assessment retrieval, null-stage safety, URL state, and client boundary: passed");
