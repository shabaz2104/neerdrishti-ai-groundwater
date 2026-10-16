import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminAuthorizationError, requireAdmin } from "@/lib/admin-auth.server";
import { CSV_HEADERS } from "@/lib/admin-csv-import";
import CsvImportForm from "./import-form";

export default async function CsvImportPage() {
  try { await requireAdmin(); }
  catch (error) {
    if (error instanceof AdminAuthorizationError) redirect(error.status === "unauthenticated" ? "/admin/login" : "/admin/login?error=unauthorized");
    throw error;
  }
  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_HEADERS.join(",") + "\r\n")}`;
  return <div className="admin-page"><div className="admin-breadcrumb"><Link href="/admin/groundwater">Groundwater records</Link><span>/</span><span>Import CSV</span></div><div className="admin-page-heading"><div><p>Dataset maintenance</p><h1>Import CSV</h1><span>Validate a 2024 groundwater CSV, review the report, then confirm new records.</span></div><Link className="admin-secondary-button" href="/admin/groundwater">Back to records</Link></div><CsvImportForm templateHref={templateHref} /></div>;
}
