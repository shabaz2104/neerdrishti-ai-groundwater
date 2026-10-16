"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  loadExplorerAssessment,
  loadExplorerAssessmentUnits,
  type ExplorerAssessment,
} from "@/app/app/explorer/actions";

const AVAILABLE_YEARS = [2024] as const;

type ExplorerProps = {
  initialDistricts: string[];
  initialDistrictsError?: string;
  initialYear: (typeof AVAILABLE_YEARS)[number];
};

const classificationLabels: Record<ExplorerAssessment["classification"], string> = {
  critical: "Critical",
  over_exploited: "Over Exploited",
  safe: "Safe",
  salinity: "Salinity",
  semi_critical: "Semi Critical",
};

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function updateExplorerUrl(
  pathname: string,
  district: string,
  assessmentUnit: string,
  year: number,
) {
  const params = new URLSearchParams();

  if (district) {
    params.set("district", district);
    params.set("year", String(year));
  }
  if (district && assessmentUnit) {
    params.set("assessmentUnit", assessmentUnit);
  }

  const query = params.toString();
  // These filters fetch through Server Actions; avoid a second RSC navigation.
  window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
}

function getFriendlyError(code: string | undefined, resource: string) {
  if (code === "NOT_FOUND" && resource === "assessment") {
    return "No groundwater assessment was found for the selected filters.";
  }

  return `The selected ${resource} could not be loaded. Please try again.`;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="nd-metric rounded-xl border border-slate-200 bg-slate-50 p-4">
      <dt className="text-sm leading-6 text-slate-500">{label}</dt>
      <dd className="mt-2 text-lg font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export default function Explorer({
  initialDistricts,
  initialDistrictsError,
  initialYear,
}: ExplorerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The URL is the source of truth on initial load AND back/forward navigation.
  const requestedDistrict = searchParams.get("district") ?? "";
  const selectedDistrict = initialDistricts.includes(requestedDistrict) ? requestedDistrict : "";
  const requestedUnit = searchParams.get("assessmentUnit") ?? "";
  const selectedYear = initialYear;
  const [unitsResult, setUnitsResult] = useState<{ district: string; data: string[]; error?: string }>({ district: "", data: [] });
  const [assessmentResult, setAssessmentResult] = useState<{ key: string; data: ExplorerAssessment | null; error?: string }>({ key: "", data: null });
  const unitsLoading = Boolean(selectedDistrict && unitsResult.district !== selectedDistrict);
  const assessmentUnits = unitsResult.district === selectedDistrict ? unitsResult.data : [];
  const unitsError = unitsResult.district === selectedDistrict ? unitsResult.error : undefined;
  const selectedAssessmentUnit = assessmentUnits.includes(requestedUnit) ? requestedUnit : "";
  const assessmentKey = JSON.stringify([selectedDistrict, selectedAssessmentUnit, selectedYear]);
  const assessmentLoading = Boolean(selectedAssessmentUnit && assessmentResult.key !== assessmentKey);
  const assessment = !assessmentLoading && selectedAssessmentUnit && assessmentResult.key === assessmentKey ? assessmentResult.data : null;
  const assessmentError = assessmentResult.key === assessmentKey ? assessmentResult.error : undefined;

  useEffect(() => {
    let cancelled = false;
    if (!selectedDistrict) return;
    void loadExplorerAssessmentUnits(selectedDistrict)
      .then((result) => {
        if (!cancelled) setUnitsResult({ district: selectedDistrict, data: result.data ?? [], error: result.error ? getFriendlyError(result.error.code, "assessment units") : undefined });
      })
      .catch(() => {
        if (!cancelled) setUnitsResult({ district: selectedDistrict, data: [], error: getFriendlyError(undefined, "assessment units") });
      });
    return () => { cancelled = true; };
  }, [selectedDistrict]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedDistrict || !selectedAssessmentUnit) return;
    void loadExplorerAssessment(selectedDistrict, selectedAssessmentUnit, selectedYear)
      .then((result) => {
        if (!cancelled) setAssessmentResult({ key: assessmentKey, data: result.data, error: result.error ? getFriendlyError(result.error.code, "assessment") : undefined });
      })
      .catch(() => {
        if (!cancelled) setAssessmentResult({ key: assessmentKey, data: null, error: getFriendlyError(undefined, "assessment") });
      });
    return () => { cancelled = true; };
  }, [assessmentKey, selectedAssessmentUnit, selectedDistrict, selectedYear]);

  function handleDistrictChange(value: string) {
    setUnitsResult({ district: "", data: [] });
    setAssessmentResult({ key: "", data: null });
    updateExplorerUrl(pathname, value, "", selectedYear);
  }

  function handleAssessmentUnitChange(value: string) {
    setAssessmentResult({ key: "", data: null });
    updateExplorerUrl(pathname, selectedDistrict, value, selectedYear);
  }

  function handleYearChange(value: string) {
    if (Number(value) === initialYear) updateExplorerUrl(pathname, selectedDistrict, selectedAssessmentUnit, initialYear);
  }

  const assessmentState = !selectedDistrict
    ? "Select a district to begin exploring groundwater data."
    : assessmentLoading
      ? "Loading assessment…"
      : assessmentError
        ? assessmentError
        : !selectedAssessmentUnit
          ? "Select an assessment unit to view groundwater data."
          : assessment
            ? undefined
            : "No groundwater assessment was found for the selected filters.";

  return (
    <section aria-labelledby="explorer-title" className="nd-page nd-explorer">
      <header className="nd-page-header">
        <div>
          <p className="nd-eyebrow">Groundwater Explorer</p>
          <h1 className="nd-page-title" id="explorer-title">
            Explore Maharashtra’s<br className="hidden sm:block" /> Groundwater Data
          </h1>
          <p className="nd-page-description">
            Select a district and assessment unit to inspect the official 2024 groundwater assessment.
          </p>
        </div>
      </header>

      <div className="nd-explorer-grid grid gap-4 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)]">
        <section className="nd-card nd-soft-card nd-filter-panel">
          <h2 className="nd-card-title">Filters</h2>
          <div className="nd-filter-fields">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="district">
                District
              </label>
              <select
                className="nd-control mt-2 w-full px-3 py-2.5 text-sm disabled:cursor-not-allowed"
                disabled={Boolean(initialDistrictsError) || initialDistricts.length === 0}
                id="district"
                onChange={(event) => handleDistrictChange(event.target.value)}
                value={selectedDistrict}
              >
                <option value="">Select district</option>
                {initialDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              {initialDistrictsError && (
                <p className="mt-2 text-sm leading-6 text-rose-700" role="alert">
                  {initialDistrictsError}
                </p>
              )}
              {!initialDistrictsError && initialDistricts.length === 0 && (
                <p className="mt-2 text-sm leading-6 text-slate-600" role="status">
                  No districts are available.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="assessment-unit">
                Assessment Unit
              </label>
              <select
                className="nd-control mt-2 w-full px-3 py-2.5 text-sm disabled:cursor-not-allowed"
                disabled={!selectedDistrict || unitsLoading || assessmentUnits.length === 0}
                id="assessment-unit"
                onChange={(event) => handleAssessmentUnitChange(event.target.value)}
                value={selectedAssessmentUnit}
              >
                <option value="">
                  {unitsLoading ? "Loading assessment units…" : "Select assessment unit"}
                </option>
                {assessmentUnits.map((assessmentUnit) => (
                  <option key={assessmentUnit} value={assessmentUnit}>
                    {assessmentUnit}
                  </option>
                ))}
              </select>
              {unitsError && (
                <p className="mt-2 text-sm leading-6 text-rose-700" role="alert">
                  {unitsError}
                </p>
              )}
              {!unitsLoading && selectedDistrict && !unitsError && assessmentUnits.length === 0 && (
                <p className="mt-2 text-sm leading-6 text-slate-600" role="status">
                  No assessment units found for this district.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="year">
                Year
              </label>
              <select
                className="nd-control mt-2 w-full px-3 py-2.5 text-sm"
                id="year"
                onChange={(event) => handleYearChange(event.target.value)}
                value={selectedYear}
              >
                {AVAILABLE_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Only the currently available assessment year is shown.
              </p>
            </div>
          </div>
        </section>

        <section aria-live="polite" className="nd-card nd-assessment-panel">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="nd-eyebrow">
                Selected assessment
              </p>
              <h2 className="nd-assessment-name">
                {assessment ? assessment.assessment_unit : "Assessment details"}
              </h2>
            </div>
            {assessment && (
              <span
                className={`nd-classification-badge nd-classification-${assessment.classification.replaceAll("_", "-")} px-3 py-1.5`}
                title={`Source classification: ${assessment.classification}`}
              >
                {classificationLabels[assessment.classification]}
              </span>
            )}
          </div>

          {assessmentState && (
            <div
              className={`nd-assessment-state rounded-xl border px-4 py-5 text-sm leading-6 ${
                assessmentLoading
                  ? "animate-pulse nd-empty"
                  : assessmentError
                    ? "nd-alert-error"
                    : "nd-empty"
              }`}
              role={assessmentError ? "alert" : "status"}
            >
              {assessmentState}
            </div>
          )}

          {assessment && (
            <div className="nd-assessment-content">
              <dl className="nd-metric-grid grid sm:grid-cols-3">
                <MetricCard label="District" value={assessment.district} />
                <MetricCard label="Assessment Unit" value={assessment.assessment_unit} />
                <MetricCard label="Year" value={String(assessment.year)} />
              </dl>

              <div>
                <h3 className="nd-eyebrow">
                  Groundwater metrics
                </h3>
                <dl className="nd-metric-grid mt-3 grid sm:grid-cols-2">
                  <MetricCard
                    label="Annual groundwater recharge"
                    value={`${formatNumber(assessment.recharge)} ha-m`}
                  />
                  <MetricCard
                    label="Annual extractable groundwater resource"
                    value={`${formatNumber(assessment.annual_extractable_groundwater_resource)} ha-m`}
                  />
                  <MetricCard
                    label="Annual groundwater extraction"
                    value={`${formatNumber(assessment.extraction)} ha-m`}
                  />
                  <MetricCard
                    label="Net annual groundwater availability"
                    value={`${formatNumber(assessment.net_groundwater_availability_for_future_use)} ha-m`}
                  />
                  <MetricCard
                    label="Stage of groundwater extraction"
                    value={
                      assessment.stage_of_groundwater_extraction_percent === null
                        ? "Not available"
                        : `${formatNumber(assessment.stage_of_groundwater_extraction_percent)}%`
                    }
                  />
                </dl>
              </div>

              <p className="border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                Groundwater resource values are shown as stored in hectare-metres (ha-m). 1 ha-m
                = 10,000 m³ = 10 million litres; this is a volume conversion only.
              </p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
