"use client";

import { useEffect, useState } from "react";

const steps = [
  ["intro", "Introduction"],
  ["approach", "My approach"],
  ["strengths", "Strengths"],
  ["background", "Background"],
  ["projects", "Portfolio"],
  ["application", "CV & application"],
  ["thank-you", "Personal note"],
] as const;

export default function AboutScrollNavigator() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) {
          const found = steps.findIndex(([id]) => id === visible[0].target.id);
          if (found !== -1) setIndex(found);
        }
      },
      { rootMargin: "-12% 0px -40% 0px", threshold: [0, 0.15, 0.4, 0.65] },
    );
    for (const [id] of steps) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function move(to: number) {
    const target = document.getElementById(steps[to][0]);
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" });
    setIndex(to);
  }

  return (
    <div
      aria-label="About page progress and section controls"
      className="sticky bottom-4 z-30 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur"
    >
      <button
        type="button"
        disabled={index === 0}
        onClick={() => move(Math.max(0, index - 1))}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40"
      >
        ← Previous
      </button>
      <p role="status" className="text-center text-xs font-semibold text-slate-700">
        {index + 1} / {steps.length}
        <span className="block text-slate-500">{steps[index][1]}</span>
      </p>
      <button
        type="button"
        disabled={index === steps.length - 1}
        onClick={() => move(Math.min(steps.length - 1, index + 1))}
        className="rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        Next ↓
      </button>
    </div>
  );
}
