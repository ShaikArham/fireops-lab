import Link from "next/link";

const journey = [
  ["overview", "Overview"],
  ["payments", "Payments"],
  ["reconciliation", "Reconciliation"],
  ["investigations", "Investigations"],
  ["monitoring", "Monitoring"],
  ["insights", "Insights"],
  ["about", "About & Application"],
] as const;

export default function JourneyNavigation({ section }: { section: string }) {
  const position = journey.findIndex(([slug]) => slug === section);
  const next = journey[position + 1];
  const previous = journey[position - 1];
  return (
    <nav
      aria-label="Guided workspace journey"
      className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-7"
    >
      {previous ? (
        <Link
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold"
          href={`/workspace/${previous[0]}`}
        >
          ← {previous[1]}
        </Link>
      ) : (
        <span />
      )}
      <p className="text-xs text-slate-500">
        Step {position + 1} of {journey.length} · Choose the next section when ready
      </p>
      {next ? (
        <Link
          className="rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white"
          href={`/workspace/${next[0]}`}
        >
          Next: {next[1]} →
        </Link>
      ) : (
        <Link
          className="rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white"
          href="/workspace/overview"
        >
          Return to overview ↺
        </Link>
      )}
    </nav>
  );
}
