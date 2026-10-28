"use client";

import Link from "next/link";

export default function RootError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="system-page min-h-screen px-5 py-16" role="alert">
      <section className="system-card mx-auto max-w-xl rounded-2xl border p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">NeerDrishti</p>
        <h1 className="mt-3 text-3xl font-bold">This page could not be loaded</h1>
        <p className="system-copy mt-3 leading-7">Please try again. No groundwater values have been estimated.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="system-primary-action rounded-xl px-4 py-2.5 font-semibold" onClick={retry} type="button">Try again</button>
          <Link className="system-secondary-action rounded-xl border px-4 py-2.5 font-semibold" href="/">Return to home</Link>
        </div>
      </section>
    </main>
  );
}
