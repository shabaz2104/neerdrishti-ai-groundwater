export default function AnalyticsLoading() {
  return (
    <div aria-label="Loading analytics" className="nd-page nd-analytics nd-skeleton" role="status">
      <div className="nd-skeleton-block h-36" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="nd-skeleton-block h-28" key={index} />
        ))}
      </div>
      <div className="nd-skeleton-block h-80" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="nd-skeleton-block h-28" key={index} />
        ))}
      </div>
      <div className="nd-skeleton-block h-80" />
    </div>
  );
}
