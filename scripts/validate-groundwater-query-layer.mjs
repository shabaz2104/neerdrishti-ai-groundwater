import assert from "node:assert/strict";
import "./ai-test-runtime.mjs";

const {
  getAssessment,
  getAssessmentUnits,
  getClassificationSummary,
  getDistricts,
  getDistrictSummary,
  getTopExtractionAreas,
} = await import("../lib/groundwater-queries.server.ts");

function assertOk(result, label) {
  assert.equal(result.error, null, `${label} returned an error`);
  return result.data;
}

function assertError(result, code, label) {
  assert.equal(result.data, null, `${label} unexpectedly returned data`);
  assert.equal(result.error?.code, code, `${label} returned the wrong error`);
  return result.error;
}

async function main() {
  const districts = assertOk(await getDistricts(), "getDistricts");
  assert.equal(districts.length, 36, "expected 36 districts");
  assert.equal(new Set(districts).size, 36, "districts must be unique");

  const assessmentUnits = assertOk(
    await getAssessmentUnits(),
    "getAssessmentUnits",
  );
  assert.equal(
    assessmentUnits.length,
    350,
    "expected 350 unique assessment units",
  );
  assert.equal(
    new Set(assessmentUnits).size,
    350,
    "assessment units must be unique",
  );

  const classificationSummary = assertOk(
    await getClassificationSummary(2024),
    "getClassificationSummary",
  );
  assert.equal(classificationSummary.year, 2024);
  assert.equal(classificationSummary.totalCount, 359);
  assert.equal(
    Object.values(classificationSummary.classificationCounts).reduce(
      (total, count) => total + count,
      0,
    ),
    359,
    "classification counts must account for all 359 rows",
  );

  const knownDistrict = districts[0];
  assert.ok(knownDistrict, "expected at least one district");
  const districtSummary = assertOk(
    await getDistrictSummary(knownDistrict, 2024),
    "getDistrictSummary",
  );
  assert.equal(districtSummary.district, knownDistrict);
  assert.equal(districtSummary.year, 2024);
  assert.ok(districtSummary.recordCount > 0, "known district must have rows");
  assert.equal(
    districtSummary.recordCount,
    Object.values(districtSummary.classificationCounts).reduce(
      (total, count) => total + count,
      0,
    ),
  );

  const topAreas = assertOk(
    await getTopExtractionAreas(2024, 5),
    "getTopExtractionAreas",
  );
  assert.ok(topAreas.length <= 5, "top extraction limit must be respected");
  assert.ok(topAreas.length > 0, "2024 must have top extraction rows");
  for (let index = 1; index < topAreas.length; index += 1) {
    assert.ok(
      topAreas[index - 1].extraction >= topAreas[index].extraction,
      "top extraction rows must be ordered descending",
    );
  }

  const firstArea = topAreas[0];
  assert.ok(firstArea, "expected a known assessment area");
  const assessment = assertOk(
    await getAssessment(firstArea.district, firstArea.assessmentUnit, 2024),
    "getAssessment",
  );
  assert.equal(assessment.year, 2024);
  assert.equal(assessment.district, firstArea.district);
  assert.equal(assessment.assessment_unit, firstArea.assessmentUnit);

  const unknownDistrict = "__query_layer_unknown_district__";
  const unknownUnits = assertOk(
    await getAssessmentUnits(unknownDistrict),
    "unknown district assessment units",
  );
  assert.deepEqual(unknownUnits, []);
  const unknownSummary = assertOk(
    await getDistrictSummary(unknownDistrict, 2024),
    "unknown district summary",
  );
  assert.equal(unknownSummary.recordCount, 0);
  assert.equal(unknownSummary.assessmentUnitCount, 0);

  assertError(
    await getDistrictSummary("", 2024),
    "INVALID_INPUT",
    "blank district",
  );
  assertError(
    await getAssessment("known", "known", 2024.5),
    "INVALID_INPUT",
    "fractional year",
  );
  assertError(
    await getTopExtractionAreas(2024, 0),
    "INVALID_INPUT",
    "zero limit",
  );

  const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "invalid-key-for-query-layer-test";
    const databaseError = await getDistricts();
    const error = assertError(
      databaseError,
      "DATABASE_ERROR",
      "invalid service-role key",
    );
    assert.equal(error.message, "Unable to load groundwater data.");
    assert.ok(
      !error.message.includes("invalid-key-for-query-layer-test"),
      "database error must not expose credential material",
    );
  } finally {
    if (originalServiceRoleKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
    }
  }

  console.log("Groundwater query-layer validation passed.");
  console.log(`  districts: ${districts.length}`);
  console.log(`  assessment units: ${assessmentUnits.length}`);
  console.log(`  2024 rows: ${classificationSummary.totalCount}`);
  console.log(`  known district: ${knownDistrict}`);
  console.log(`  top extraction rows checked: ${topAreas.length}`);
  console.log("  invalid input, empty result, and hidden-error checks: passed");
}

main().catch(() => {
  console.error("Groundwater query-layer validation failed.");
  process.exitCode = 1;
});
