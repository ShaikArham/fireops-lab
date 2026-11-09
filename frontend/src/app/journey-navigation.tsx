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
  const bottomRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!next) return;
    let armed = false;
    let navigating = false;
    let lastBottomGesture = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        armed = entry.isIntersecting;
        if (!armed) lastBottomGesture = 0;
      },
      { threshold: 0.65 },
    );
    if (bottomRef.current) observer.observe(bottomRef.current);
    const goNext = () => {
      if (!armed || navigating) return;
      navigating = true;
      router.push(`/workspace/${next[0]}`);
    };
    const onWheel = (event: WheelEvent) => {
      if (!armed || event.deltaY < 20 || event.ctrlKey || event.defaultPrevented) return;
      const now = Date.now();
      if (now - lastBottomGesture < 1600 && now - lastBottomGesture > 200) goNext();
      else lastBottomGesture = now;
    };
    let startY = 0;
    let startedAtBottom = false;
    const onTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? 0;
      startedAtBottom = armed;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const endY = event.changedTouches[0]?.clientY ?? startY;
      if (startedAtBottom && armed && startY - endY > 85) goNext();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [next, router]);

  return (
    <nav
      ref={bottomRef}
      aria-label="Guided workspace journey"
      className="mt-10 flex flex-col gap-4 border-t border-slate-200 pb-8 pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      {previous ? (
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold"
          href={`/workspace/${previous[0]}`}
        >
          ← {previous[1]}
        </Link>
      ) : (
        <span />
      )}
      <p className="text-center text-xs text-slate-500">
        Step {position + 1} of {journey.length} ·{" "}
        {next ? "Swipe up again at the bottom or tap Next" : "End of the guided journey"}
      </p>
      {next ? (
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-800 px-5 py-3 text-center text-sm font-semibold text-white"
          href={`/workspace/${next[0]}`}
        >
          Next: {next[1]} →
        </Link>
      ) : (
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white"
          href="/workspace/overview"
        >
          Return to overview ↺
        </Link>
      )}
    </nav>
  );
}
