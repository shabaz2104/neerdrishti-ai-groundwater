export default function DashboardLoading() {
  return <div aria-label="Loading dashboard" className="dashboard-page dashboard-skeleton" role="status">
    <div className="dashboard-hero" />
    <div className="dashboard-content">
      <div className="dashboard-kpis">{Array.from({ length: 5 }, (_, index) => <div className="dashboard-card dashboard-kpi" key={index} />)}</div>
      <div className="dashboard-main-grid"><div className="dashboard-left-column"><div className="dashboard-card dashboard-map-card" /><div className="dashboard-bottom-grid"><div className="dashboard-card dashboard-small-card" /><div className="dashboard-card dashboard-small-card" /></div></div><div className="dashboard-right-column"><div className="dashboard-card dashboard-classification" /><div className="dashboard-card dashboard-assistant" /></div></div>
    </div>
  </div>;
}
