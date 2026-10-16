import Link from "next/link";
import Form from "next/form";
import { redirect } from "next/navigation";

import DashboardIcon from "@/app/app/dashboard-icons";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin-auth.server";
import { ADMIN_CLASSIFICATIONS } from "@/lib/admin-groundwater";
import { getAdminGroundwaterRecords } from "@/lib/admin-groundwater.server";
import { getDistricts } from "@/lib/groundwater-queries.server";

type RawSearchParams = Record<string, string | string[] | undefined>;
type SearchParams = { classification?: string; district?: string; page?: string; search?: string; year?: string };
const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const labels: Record<string, string> = { critical: "Critical", over_exploited: "Over Exploited", safe: "Safe", salinity: "Salinity", semi_critical: "Semi Critical" };

function pageHref(params: SearchParams, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value && key !== "page") query.set(key, value);
  query.set("page", String(page));
  return `/admin/groundwater?${query.toString()}`;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminGroundwaterPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const rawParams = await searchParams;
  const params: SearchParams = {
    classification: first(rawParams.classification), district: first(rawParams.district),
    page: first(rawParams.page), search: first(rawParams.search), year: first(rawParams.year),
  };
  const parsedPage = Number(params.page);
  const parsedYear = Number(params.year);
  const filters = {
    classification: params.classification,
    district: params.district,
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    search: params.search,
    year: Number.isInteger(parsedYear) && parsedYear > 0 ? parsedYear : undefined,
  };
  let result;
  let districtResult;
  try {
    await requireAdmin();
    [result, districtResult] = await Promise.all([getAdminGroundwaterRecords(filters), getDistricts()]);
  } catch (error) {
    if (error instanceof AdminAuthorizationError) redirect(error.status === "unauthenticated" ? "/admin/login" : "/admin/login?error=unauthorized");
    throw error;
  }
  if (result.page > result.pageCount) redirect(pageHref(params, result.pageCount));
  return <div className="admin-page admin-records-page"><div className="admin-page-heading"><div><p>Groundwater data</p><h1>Assessment records</h1><span>Search and inspect existing records before making a controlled correction.</span></div><div className="admin-import-heading-actions"><span className="admin-result-count"><strong>{result.total}</strong> matching records</span><Link className="admin-primary-button" href="/admin/groundwater/import">Import CSV</Link></div></div>
    <div key={JSON.stringify(params)}><Form className="admin-filter-panel" action="/admin/groundwater"><label className="admin-search-field"><span>Search</span><div><DashboardIcon name="search" /><input defaultValue={params.search ?? ""} name="search" placeholder="District or assessment unit" /></div></label><label><span>District</span><select defaultValue={params.district ?? ""} name="district"><option value="">All districts</option>{(districtResult.data ?? []).map((district) => <option key={district}>{district}</option>)}</select></label><label><span>Classification</span><select defaultValue={params.classification ?? ""} name="classification"><option value="">All classifications</option>{ADMIN_CLASSIFICATIONS.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label><label><span>Year</span><select defaultValue={params.year ?? ""} name="year"><option value="">All years</option><option value="2024">2024</option></select></label><button className="admin-primary-button" type="submit">Apply filters</button><Link className="admin-secondary-button" href="/admin/groundwater">Clear</Link></Form></div>
    <div className="admin-table-card"><div className="admin-table-scroll"><table><thead><tr><th>District / Assessment unit</th><th>Year</th><th>Classification</th><th>Recharge</th><th>Extractable resource</th><th>Extraction</th><th>Net availability</th><th>Stage</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{result.records.map((record) => <tr key={record.id}><td><strong>{record.district}</strong><span>{record.assessment_unit}</span></td><td>{record.year}</td><td><span className={`admin-classification is-${record.classification}`}>{labels[record.classification]}</span></td><td>{number.format(record.recharge)} <small>ha-m</small></td><td>{number.format(record.annual_extractable_groundwater_resource)} <small>ha-m</small></td><td>{number.format(record.extraction)} <small>ha-m</small></td><td>{number.format(record.net_groundwater_availability_for_future_use)} <small>ha-m</small></td><td>{record.stage_of_groundwater_extraction_percent === null ? "Not available" : `${number.format(record.stage_of_groundwater_extraction_percent)}%`}</td><td><Link className="admin-row-action" prefetch={false} href={`/admin/groundwater/${record.id}`}>Inspect <DashboardIcon name="arrow" /></Link></td></tr>)}</tbody></table></div>{result.records.length === 0 && <p className="admin-empty">No groundwater records match these filters.</p>}</div>
    <nav className="admin-pagination" aria-label="Record pages"><span>Page {result.page} of {result.pageCount}</span><div>{result.page > 1 ? <Link prefetch={false} href={pageHref(params, result.page - 1)}>Previous</Link> : <span aria-disabled="true">Previous</span>}{result.page < result.pageCount ? <Link prefetch={false} href={pageHref(params, result.page + 1)}>Next</Link> : <span aria-disabled="true">Next</span>}</div></nav>
  </div>;
}
