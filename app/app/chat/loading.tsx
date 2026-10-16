export default function ChatLoading() {
  return <div aria-label="Loading AI Assistant" className="nd-page nd-chat nd-skeleton" role="status">
    <div className="nd-skeleton-block h-36" />
    <div className="nd-skeleton-block h-96" />
  </div>;
}
