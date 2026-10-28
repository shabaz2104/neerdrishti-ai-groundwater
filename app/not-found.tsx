import Link from "next/link";

export default function NotFound() {
  return (
    <main className="system-page min-h-screen px-5 py-16">
      <section className="system-card mx-auto max-w-xl rounded-2xl border p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">NeerDrishti</p>
        <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
        <p className="system-copy mt-3 leading-7">The requested page or groundwater record is not available.</p>
        <Link className="system-primary-action mt-6 inline-flex rounded-xl px-4 py-2.5 font-semibold" href="/">
          Return to home
        </Link>
      </section>
    </main>
  );
}
