"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

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
  const navigating = useRef(false);
  const wheelDistance = useRef(0);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    navigating.current = false;
    wheelDistance.current = 0;
    const atBottom = () =>
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
    const atTop = () => window.scrollY <= 8;
    function advance(direction: "next" | "previous") {
      const target = direction === "next" ? next : previous;
      if (!target || navigating.current) return;
      navigating.current = true;
      router.push(`/workspace/${target[0]}`, { scroll: true });
    }
    function onWheel(event: WheelEvent) {
      if (
        event.ctrlKey ||
        event.metaKey ||
        (event.target instanceof Element &&
          event.target.closest(
            "[data-no-journey-scroll], input, textarea, select, [role='dialog']",
          ))
      )
        return;
      const down = event.deltaY > 0;
      if ((down && atBottom() && next) || (!down && atTop() && previous)) {
        wheelDistance.current += event.deltaY;
        if (Math.abs(wheelDistance.current) > 35) {
          wheelDistance.current = 0;
          advance(down ? "next" : "previous");
        }
      } else wheelDistance.current = 0;
    }
    function onTouchStart(event: TouchEvent) {
      touchStart.current = event.touches[0]?.clientY ?? null;
    }
    function onTouchEnd(event: TouchEvent) {
      if (touchStart.current === null) return;
      const end = event.changedTouches[0]?.clientY ?? touchStart.current;
      const distance = touchStart.current - end;
      touchStart.current = null;
      if (distance > 90 && atBottom()) advance("next");
      else if (distance < -90 && atTop()) advance("previous");
    }
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [next, previous, router]);

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
        Step {position + 1} of {journey.length} · Scroll beyond the page end to continue
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
