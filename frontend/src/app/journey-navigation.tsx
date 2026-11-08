"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
  const router = useRouter();
  const position = journey.findIndex(([slug]) => slug === section);
  const next = journey[position + 1];
  const previous = journey[position - 1];

  useEffect(() => {
    if (!next) return;
    let gestures = 0;
    let lastGesture = 0;
    let navigating = false;
    const atBottom = () =>
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 28;
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY <= 0 || event.ctrlKey || event.defaultPrevented || navigating) return;
      if (!atBottom()) {
        gestures = 0;
        return;
      }
      if (Date.now() - lastGesture > 1200) gestures = 0;
      lastGesture = Date.now();
      if (++gestures >= 2) {
        navigating = true;
        router.push(`/workspace/${next[0]}`);
      }
    };
    let touchStart = 0;
    const onTouchStart = (event: TouchEvent) => {
      touchStart = event.touches[0]?.clientY ?? 0;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const end = event.changedTouches[0]?.clientY ?? touchStart;
      if (!navigating && touchStart - end > 75 && atBottom()) {
        navigating = true;
        router.push(`/workspace/${next[0]}`);
      }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [next, router]);

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
        Step {position + 1} of {journey.length} · {next ? "Scroll beyond the bottom or use Next" : "End of the guided journey"}
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
