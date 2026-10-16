"use client";

import Link from "next/link";

export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <section className="nd-page" role="alert"><div className="nd-card p-6">
    <h1 className="nd-section-title">This page could not be loaded</h1>
    <p className="mt-3 text-sm text-slate-600">Please try again. No groundwater values have been estimated.</p>
    <div className="mt-5 flex flex-wrap gap-3"><button className="nd-button-primary px-4 py-2" onClick={retry} type="button">Try again</button><Link className="nd-button-secondary px-4 py-2" href="/app">Back to dashboard</Link></div>
  </div></section>;
}
