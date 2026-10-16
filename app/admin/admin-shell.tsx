import Link from "next/link";

import DashboardIcon from "@/app/app/dashboard-icons";
import PublicBrand from "@/app/public-brand";

import AdminSignOutButton from "./admin-sign-out-button";

export default function AdminShell({ children, userEmail }: { children: React.ReactNode; userEmail?: string }) {
  return <div className="admin-site"><header className="admin-header"><PublicBrand /><div className="admin-header-label"><span>Administration</span><small>Authorized workspace</small></div><div className="admin-header-actions"><span title={userEmail}>{userEmail}</span><Link href="/app">Back to NeerDrishti</Link><AdminSignOutButton /></div></header><div className="admin-frame"><aside className="admin-sidebar"><p>NeerDrishti Administration</p><nav aria-label="Administration"><Link href="/admin"><DashboardIcon name="home" />Overview</Link><Link href="/admin/groundwater"><DashboardIcon name="records" />Groundwater records</Link></nav><div className="admin-privilege-note"><DashboardIcon name="info" /><span>Changes here update the application database.</span></div></aside><main className="admin-main" id="admin-main">{children}</main></div></div>;
}
