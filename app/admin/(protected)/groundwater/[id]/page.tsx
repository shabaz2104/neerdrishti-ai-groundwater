import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import DashboardIcon from "@/app/app/dashboard-icons";
import { AdminAuthorizationError } from "@/lib/admin-auth.server";
import { getAdminGroundwaterRecord } from "@/lib/admin-groundwater.server";

import AdminRecordForm from "./record-form";

export default async function AdminGroundwaterEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound();
  let record;
  try {
    record = await getAdminGroundwaterRecord(id);
  } catch (error) {
    if (error instanceof AdminAuthorizationError) redirect(error.status === "unauthenticated" ? "/admin/login" : "/admin/login?error=unauthorized");
    throw error;
  }
  if (!record) notFound();
  return <div className="admin-page admin-edit-page"><div className="admin-breadcrumb"><Link href="/admin/groundwater">Groundwater records</Link><span>/</span><span>{record.district} · {record.assessment_unit}</span></div><div className="admin-page-heading"><div><p>Controlled correction</p><h1>Edit assessment record</h1><span>Review every change carefully. Source and import provenance remain read-only.</span></div><Link className="admin-secondary-button" href="/admin/groundwater"><DashboardIcon name="arrow" />Back to records</Link></div><AdminRecordForm record={record} /></div>;
}
