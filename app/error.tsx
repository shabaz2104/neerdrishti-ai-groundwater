"use client";

import Link from "next/link";

export default function RootError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-16 text-slate-900" role="alert">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">NeerDrishti</p>
        <h1 className="mt-3 text-3xl font-bold">This page could not be loaded</h1>
        <p className="mt-3 leading-7 text-slate-600">Please try again. No groundwater values have been estimated.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white" onClick={retry} type="button">Try again</button>
          <Link className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold" href="/">Return to home</Link>
        </div>
      </section>
    </main>
  );
}
