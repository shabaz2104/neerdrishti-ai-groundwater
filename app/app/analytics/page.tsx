import Link from "next/link";

import {
  getAssessmentUnits,
  getClassificationSummary,
  getDistrictComparison,
  getDistricts,
  getOverallSummary,
  getTopExtractionAreas,
  type GroundwaterClassification,
} from "@/lib/groundwater-queries.server";
import AnalyticsMap from "./analytics-map";
import DashboardIcon from "../dashboard-icons";

export const dynamic = "force-dynamic";

const ANALYSIS_YEAR = 2024;

const classificationLabels: Record<GroundwaterClassification, string> = {
  critical: "Critical",
  over_exploited: "Over Exploited",
  safe: "Safe",
  salinity: "Salinity",
  semi_critical: "Semi Critical",
};

const classificationColors: Record<GroundwaterClassification, string> = {
  critical: "nd-classification-critical",
  over_exploited: "nd-classification-over-exploited",
  safe: "nd-classification-safe",
  salinity: "nd-classification-salinity",
  semi_critical: "nd-classification-semi-critical",
};

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatClassification(classification: GroundwaterClassification) {
  return classificationLabels[classification];
}

function KpiCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: "records" | "districts" | "calendar";
  tone: string;
}) {
  return (
    <article className="nd-kpi flex items-center gap-3">
      <span aria-hidden="true" className={`dashboard-kpi-icon ${tone}`}><DashboardIcon name={icon} className="h-6 w-6" /></span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="nd-kpi-value text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm leading-6 text-slate-600">{detail}</p>
      </div>
    </article>
  );
}

function ClassificationChart({
  summary,
}: {
  summary: Awaited<ReturnType<typeof getClassificationSummary>>;
}) {
  if (summary.error) {
    return (
      <div className="nd-alert-error rounded-xl border p-5 text-sm leading-6" role="alert">
        Classification data could not be loaded. Please refresh and try again.
      </div>
    );
  }

  if (summary.data.totalCount === 0) {
    return (
      <div className="nd-empty rounded-xl border border-dashed p-5 text-sm leading-6" role="status">
        No classification records are available for the 2024 assessment.
      </div>
    );
  }

  const counts = summary.data.classificationCounts;
  const total = summary.data.totalCount;
  const maximum = Math.max(...Object.values(counts), 1);
  const classifications = Object.keys(classificationLabels) as GroundwaterClassification[];

  return (
    <div aria-label="Classification distribution" className="space-y-5" role="list">
      {classifications.map((classification) => {
        const count = counts[classification];
        const percentage = Math.round((count / total) * 100);
        const barWidth = Math.round((count / maximum) * 100);

        return (
          <div className="nd-chart-row space-y-2" key={classification} role="listitem">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold text-slate-800">{formatClassification(classification)}</span>
              <span className="text-slate-500">
                {count} records · {percentage}%
              </span>
            </div>
            <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`nd-classification-bar h-full rounded-full ${classificationColors[classification]}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResourceMetric({ label, value, sourceField, accent }: {
  label: string;
  value: string;
  sourceField: string;
  accent: string;
}) {
  return (
    <article className="nd-metric nd-resource-metric rounded-2xl border p-5">
      <div className={`h-1.5 w-12 rounded-full ${accent}`} />
      <p className="mt-5 text-sm font-medium leading-6 text-slate-600">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 text-xs leading-5 text-slate-500">Source field: {sourceField}</p>
    </article>
  );
}

function ClassificationBadge({ classification }: { classification: GroundwaterClassification }) {
  return (
    <span
      className={`nd-classification-badge nd-classification-${classification.replaceAll("_", "-")} px-2.5 py-1`}
      title={`Source classification: ${classification}`}
    >
      {formatClassification(classification)}
    </span>
  );
}

function ExtractionAreaTable({
  result,
}: {
  result: Awaited<ReturnType<typeof getTopExtractionAreas>>;
}) {
  if (result.error) {
    return (
      <div className="nd-alert-error rounded-xl border p-5 text-sm leading-6" role="alert">
        Extraction areas could not be loaded. Please refresh and try again.
      </div>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="nd-empty rounded-xl border border-dashed p-5 text-sm leading-6" role="status">
        No extraction assessment areas are available for the 2024 assessment.
      </div>
    );
  }

  return (
    <>
      <div className="nd-table-wrap hidden overflow-x-auto sm:block">
        <table className="nd-table w-full min-w-[42rem] border-collapse text-left text-sm">
          <caption className="sr-only">Ten highest-extraction assessment areas in 2024</caption>
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
              <th className="px-3 py-3 font-semibold" scope="col">Assessment Unit</th>
              <th className="px-3 py-3 font-semibold" scope="col">District</th>
              <th className="px-3 py-3 text-right font-semibold" scope="col">Extraction</th>
              <th className="px-3 py-3 font-semibold" scope="col">Classification</th>
              <th className="px-3 py-3 text-right font-semibold" scope="col">Year</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((area) => (
              <tr
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                key={`${area.district}-${area.assessmentUnit}-${area.year}`}
              >
                <th className="px-3 py-4 font-semibold text-slate-800" scope="row">
                  {area.assessmentUnit}
                </th>
                <td className="px-3 py-4 text-slate-600">{area.district}</td>
                <td className="px-3 py-4 text-right font-semibold text-slate-900">
                  {formatNumber(area.extraction)} ha-m
                </td>
                <td className="px-3 py-4"><ClassificationBadge classification={area.classification} /></td>
                <td className="px-3 py-4 text-right text-slate-600">{area.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {result.data.map((area, index) => (
          <article
            className="nd-subtle-panel p-4"
            key={`${area.district}-${area.assessmentUnit}-${area.year}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{area.assessmentUnit}</p>
                <p className="mt-1 text-xs text-slate-500">{area.district} · {area.year}</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Groundwater extraction</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{formatNumber(area.extraction)} ha-m</p>
              </div>
              <ClassificationBadge classification={area.classification} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default async function AnalyticsPage() {
  const [overallSummary, classificationSummary, districts, assessmentUnits, extractionAreas, districtComparison] =
    await Promise.all([
      getOverallSummary(ANALYSIS_YEAR),
      getClassificationSummary(ANALYSIS_YEAR),
      getDistricts(),
      getAssessmentUnits(),
      getTopExtractionAreas(ANALYSIS_YEAR, 10),
      getDistrictComparison(ANALYSIS_YEAR),
    ]);

  const hasQueryError = Boolean(
    overallSummary.error ||
      classificationSummary.error ||
      districts.error ||
      assessmentUnits.error ||
      extractionAreas.error ||
      districtComparison.error,
  );
  const recordCount = classificationSummary.error ? "—" : classificationSummary.data.totalCount;
  const districtCount = districts.error ? "—" : districts.data.length;
  const assessmentUnitCount = assessmentUnits.error ? "—" : assessmentUnits.data.length;

  return (
    <section aria-labelledby="analytics-title" className="nd-page nd-analytics">
      <header className="nd-page-header">
        <div className="max-w-3xl">
          <p className="nd-eyebrow">
            Groundwater Analytics
          </p>
          <h1 className="nd-page-title" id="analytics-title">
            Maharashtra’s Groundwater Analysis
          </h1>
          <p className="nd-page-description">
            Study the verified 2024 assessment through district maps, classification counts, resource totals, and extraction comparisons.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
            2024 Assessment
          </span>
          <Link
            className="nd-button-primary inline-flex min-h-11 items-center px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2"
            href="/app/explorer"
          >
            Explore Individual Assessments <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </header>

      {hasQueryError && (
        <div className="nd-alert-warning rounded-xl border px-5 py-4 text-sm leading-6" role="alert">
          Some analytics data could not be loaded. Unavailable values are shown with an em dash;
          please refresh and try again.
        </div>
      )}

      <section aria-labelledby="analytics-kpi-title">
        <div className="mb-4">
          <p className="nd-eyebrow">Dataset scale</p>
          <h2 className="nd-section-title mt-2" id="analytics-kpi-title">
            The numbers behind the analysis
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon="records" tone="is-amber" detail="Validated 2024 assessment records" label="Records" value={recordCount} />
          <KpiCard icon="districts" tone="is-green" detail="Districts represented in the dataset" label="Districts" value={districtCount} />
          <KpiCard icon="records" tone="is-blue" detail="Unique assessment units represented" label="Assessment Units" value={assessmentUnitCount} />
          <KpiCard icon="calendar" tone="is-violet" detail="Current available assessment year" label="Assessment Year" value={ANALYSIS_YEAR} />
        </div>
      </section>

      <section aria-labelledby="classification-title" className="nd-card nd-analysis-card">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="nd-eyebrow">Classification Distribution</p>
            <h2 className="nd-section-title mt-2" id="classification-title">
              How the 2024 records are classified
            </h2>
          </div>
          {!classificationSummary.error && (
            <p className="text-sm text-slate-500">{classificationSummary.data.totalCount} records · counts shown by source class</p>
          )}
        </div>
        <div className="mt-8 max-w-4xl">
          <ClassificationChart summary={classificationSummary} />
        </div>
        <p className="mt-8 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
          The classes are presented as stored in the source dataset. They are not ranked and do
          not represent a custom risk score.
        </p>
      </section>

      <AnalyticsMap
        aggregationError={districtComparison.error !== null}
        districts={districtComparison.error ? [] : districtComparison.data}
        year={ANALYSIS_YEAR}
      />

      <section aria-labelledby="resource-title">
        <div className="mb-4">
          <p className="nd-eyebrow">Groundwater Resource Overview</p>
          <h2 className="nd-section-title mt-2" id="resource-title">
            Stored resource totals for the assessment year
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            These totals aggregate the corresponding stored source fields across the 2024 records.
            Values are shown in hectare-metres (ha-m); no derived availability formula is applied.
          </p>
        </div>
        {overallSummary.error ? (
          <div className="nd-alert-error rounded-xl border p-5 text-sm leading-6" role="alert">
            Resource totals could not be loaded. Please refresh and try again.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <ResourceMetric
              accent="bg-emerald-500"
              label="Annual groundwater recharge"
              sourceField="recharge"
              value={`${formatNumber(overallSummary.data.totalAnnualRecharge)} ha-m`}
            />
            <ResourceMetric
              accent="bg-sky-500"
              label="Annual extractable groundwater resource"
              sourceField="annual_extractable_groundwater_resource"
              value={`${formatNumber(overallSummary.data.totalAnnualExtractableGroundwaterResource)} ha-m`}
            />
            <ResourceMetric
              accent="bg-orange-500"
              label="Annual groundwater extraction"
              sourceField="extraction"
              value={`${formatNumber(overallSummary.data.totalGroundwaterExtraction)} ha-m`}
            />
            <ResourceMetric
              accent="bg-violet-500"
              label="Net annual groundwater availability"
              sourceField="net_groundwater_availability_for_future_use"
              value={`${formatNumber(overallSummary.data.totalNetGroundwaterAvailability)} ha-m`}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="extraction-title" className="nd-card nd-analysis-card">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="nd-eyebrow">Extraction-based ordering</p>
            <h2 className="nd-section-title mt-2" id="extraction-title">
              Highest Extraction Assessment Areas
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              The table is ordered by stored groundwater extraction for 2024. This is not a risk
              ranking.
            </p>
          </div>
          <span className="text-sm text-slate-500">Top 10 records</span>
        </div>
        <div className="mt-6">
          <ExtractionAreaTable result={extractionAreas} />
        </div>
      </section>
    </section>
  );
}
