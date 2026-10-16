export default function AdminLoading() {
  return <div className="admin-page admin-loading" role="status" aria-label="Loading administration">
    <span className="sr-only">Loading administration data</span>
    <div className="admin-loading-heading" aria-hidden="true" />
    <div className="admin-kpi-grid" aria-hidden="true">{[0, 1, 2, 3].map((key) => <div className="admin-loading-card" key={key} />)}</div>
    <div className="admin-loading-content" aria-hidden="true" />
  </div>;
}
