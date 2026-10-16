type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function PlaceholderPage({
  eyebrow,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section aria-labelledby="placeholder-title" className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {eyebrow}
        </p>
        <h1
          className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          id="placeholder-title"
        >
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">Feature implementation coming next.</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This section is reserved for a future NeerDrishti ticket. No placeholder data or fake
          interactions are shown here.
        </p>
      </div>
    </section>
  );
}
