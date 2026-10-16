export default function RecordsLoading() {
  return <div className="admin-page admin-loading" role="status" aria-label="Loading groundwater records">
    <span className="sr-only">Loading groundwater records</span>
    <div className="admin-loading-heading" aria-hidden="true" />
    <div className="admin-loading-filters" aria-hidden="true" />
    <div className="admin-loading-content" aria-hidden="true" />
  </div>;
}
