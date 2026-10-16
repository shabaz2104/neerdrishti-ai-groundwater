export default function ExplorerLoading() {
  return <div aria-label="Loading Explorer" className="nd-page nd-explorer nd-skeleton" role="status">
    <div className="nd-skeleton-block h-36" />
    <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)]">
      <div className="nd-skeleton-block h-80" />
      <div className="nd-skeleton-block h-80" />
    </div>
  </div>;
}
