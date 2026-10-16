"use client";

export default function AdminError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <div className="admin-page"><section className="admin-operation-card"><div><div><h1>Administration data unavailable</h1><p>The requested administration data could not be loaded safely. No changes were made.</p></div></div><button className="admin-primary-button" onClick={retry} type="button">Try again</button></section></div>;
}
