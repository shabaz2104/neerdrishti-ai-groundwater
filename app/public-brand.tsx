import Link from "next/link";

import DashboardIcon from "@/app/app/dashboard-icons";

export default function PublicBrand() {
  return <Link className="public-brand" href="/" aria-label="NeerDrishti, home"><span className="public-brand-mark" aria-hidden="true"><DashboardIcon name="drop" className="h-6 w-6" /></span><span className="public-brand-text"><strong>NeerDrishti</strong><small>Maharashtra Groundwater Insights</small></span></Link>;
}
