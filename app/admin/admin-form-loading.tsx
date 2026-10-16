export default function AdminFormLoading({ label }: { label: string }) {
  return <div className="admin-page admin-loading" role="status" aria-label={label}>
    <span className="sr-only">{label}</span>
    <div className="admin-loading-heading" aria-hidden="true" />
    <div className="admin-loading-filters" aria-hidden="true" />
    <div className="admin-loading-content" aria-hidden="true" />
  </div>;
}
