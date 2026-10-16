import assert from "node:assert/strict";
import "./ai-test-runtime.mjs";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  const absolutePath = resolve(root, relativePath);
  assert.ok(existsSync(absolutePath), `missing analytics file: ${relativePath}`);
  return readFileSync(absolutePath, "utf8");
}

const analyticsSource = read("app/app/analytics/page.tsx");
assert.match(analyticsSource, /getOverallSummary/);
assert.match(analyticsSource, /getClassificationSummary/);
assert.match(analyticsSource, /getDistrictComparison/);
assert.match(analyticsSource, /getTopExtractionAreas/);
assert.match(analyticsSource, /AnalyticsMap/);
assert.match(analyticsSource, /\/app\/explorer/);
assert.match(analyticsSource, /ha-m/);
assert.doesNotMatch(analyticsSource, /SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(analyticsSource, /getAssessment\(/);

const {
  getClassificationSummary,
  getDistrictComparison,
  getOverallSummary,
  getTopExtractionAreas,
} = await import("../lib/groundwater-queries.server.ts");

const overall = await getOverallSummary(2024);
assert.equal(overall.error, null);
assert.equal(overall.data?.recordCount, 359);
assert.equal(overall.data?.assessmentUnitCount, 350);

const classifications = await getClassificationSummary(2024);
assert.equal(classifications.error, null);
assert.deepEqual(classifications.data?.classificationCounts, {
  critical: 7,
  over_exploited: 8,
  safe: 302,
  salinity: 1,
  semi_critical: 41,
});
assert.equal(classifications.data?.totalCount, 359);

const extractionAreas = await getTopExtractionAreas(2024, 10);
assert.equal(extractionAreas.error, null);
assert.ok(extractionAreas.data.length <= 10);
for (let index = 1; index < extractionAreas.data.length; index += 1) {
  assert.ok(
    extractionAreas.data[index - 1].extraction >= extractionAreas.data[index].extraction,
    "extraction areas must be sorted descending",
  );
}

const districtComparison = await getDistrictComparison(2024);
assert.equal(districtComparison.error, null);
assert.equal(districtComparison.data.length, 36);
assert.equal(
  new Set(districtComparison.data.map((district) => district.district)).size,
  36,
);
assert.ok(
  districtComparison.data.every(
    (district) => district.assessmentUnitCount > 0,
  ),
  "every district must have assessment units",
);

console.log("Analytics validation passed.");
console.log("  2024 summary: 359 records, 350 units");
console.log("  classification counts: 7, 8, 302, 1, 41 (total 359)");
console.log(`  extraction rows checked: ${extractionAreas.data.length}`);
console.log("  district comparison: 36 unique aggregates");
console.log("  server-query boundary, Explorer CTA, ha-m labels, and ordering: passed");
