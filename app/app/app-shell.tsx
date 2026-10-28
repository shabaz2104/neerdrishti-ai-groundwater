import Link from "next/link";

import AppNavigation from "@/app/app/app-navigation";
import DashboardIcon from "@/app/app/dashboard-icons";
import SignOutButton from "@/app/app/sign-out-button";
import ThemeToggle from "@/app/theme-toggle";

type AppShellProps = { children: React.ReactNode; userEmail?: string };

export default function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="app-brand" href="/app" aria-label="NeerDrishti home">
          <span className="app-brand-mark" aria-hidden="true"><DashboardIcon name="drop" className="h-9 w-9" /></span>
          <span><strong>NeerDrishti</strong><small>Maharashtra Groundwater Insights</small></span>
        </Link>
        <Link className="app-search" href="/app/explorer" aria-label="Open Explorer to search districts and assessment units">
          <DashboardIcon name="search" />
          <span>Search district, taluka or assessment unit...</span>
        </Link>
        <div className="app-header-actions">
          <span className="app-year" aria-label="Assessment year 2024, the only available year"><DashboardIcon name="calendar" className="h-4 w-4" /> 2024</span>
          <ThemeToggle />
          <div className="app-profile" title={userEmail ?? "Authenticated user"} aria-label={userEmail ?? "Authenticated user"}><DashboardIcon name="user" /></div>
          <SignOutButton />
        </div>
      </header>
      <div className="app-frame">
        <AppNavigation />
        <main className="app-main" id="main-content">{children}</main>
      </div>
    </div>
  );
}
