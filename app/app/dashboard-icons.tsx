type IconName =
  | "home" | "map" | "explore" | "analytics" | "chat" | "info" | "help"
  | "search" | "calendar" | "user" | "chevron" | "drop" | "pump"
  | "records" | "districts" | "arrow";

export default function DashboardIcon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24", "aria-hidden": true as const };
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h5v-6h4v6h5V9" /></>,
    map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z" /><path d="M9 3v16M15 5v16" /></>,
    explore: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 8h.01M11 8h6M8 12h.01M11 12h6M8 16h.01M11 16h6" /></>,
    analytics: <><path d="M4 20h16M7 17V9h3v8M13 17V4h3v13M19 17v-5" /></>,
    chat: <path d="M4 5h16v12H8l-4 3zM8 9h8M8 13h5" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2l-1.5 1.5V14M12 17h.01" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    drop: <path d="M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13Z" />,
    pump: <><path d="M6 20h12M8 20v-9h8v9M7 11V7h6V4h3M16 13h3l2 2v4M10 15h4" /></>,
    records: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    districts: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3 19a6 6 0 0 1 12 0M15 15a5 5 0 0 1 6 4" /></>,
    arrow: <><path d="M4 12h16M14 6l6 6-6 6" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}
