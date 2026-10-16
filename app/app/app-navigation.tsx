"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import DashboardIcon from "./dashboard-icons";

const navigationItems = [
  { href: "/app", label: "Home", icon: "home" },
  { href: "/app/analytics#district-map-title", label: "Map", icon: "map" },
  { href: "/app/explorer", label: "Explore Data", icon: "explore" },
  { href: "/app/analytics", label: "Analytics", icon: "analytics" },
  { href: "/app/chat", label: "AI Assistant", icon: "chat" },
] as const;

const secondaryItems = [
  { href: "/app#about", label: "About", icon: "info" },
  { href: "/app#help", label: "Help", icon: "help" },
] as const;

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <ul className="app-nav-list">
        {navigationItems.map((item) => {
          const isActive = item.href === "/app"
            ? pathname === "/app"
            : item.href === "/app/analytics"
              ? pathname === "/app/analytics"
              : item.href.includes("#") ? false : pathname === item.href;
          return <li key={item.label}><Link aria-current={isActive ? "page" : undefined} className={`app-nav-link${isActive ? " is-active" : ""}`} href={item.href} onClick={onNavigate}><DashboardIcon name={item.icon} /><span>{item.label}</span></Link></li>;
        })}
      </ul>
      <ul className="app-nav-list app-nav-secondary">
        {secondaryItems.map((item) => <li key={item.label}><Link className="app-nav-link" href={item.href} onClick={onNavigate}><DashboardIcon name={item.icon} /><span>{item.label}</span></Link></li>)}
      </ul>
    </>
  );
}

export default function AppNavigation() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  return (
    <>
      <aside className="app-sidebar"><nav aria-label="Application navigation"><NavigationLinks /></nav></aside>
      <div className="app-mobile-nav">
        <button aria-controls="mobile-application-navigation" aria-expanded={isMobileOpen} className="app-mobile-toggle" onClick={() => setIsMobileOpen((open) => !open)} type="button">Menu <span aria-hidden="true">{isMobileOpen ? "−" : "+"}</span></button>
        {isMobileOpen && <nav aria-label="Application navigation" id="mobile-application-navigation"><NavigationLinks onNavigate={() => setIsMobileOpen(false)} /></nav>}
      </div>
    </>
  );
}
