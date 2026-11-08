"use client";

import { useRef, useState } from "react";

const sections = [
  ["operations", "Payment day"],
  ["reconciliation", "Reconciliation"],
  ["investigation", "Investigation"],
  ["monitoring", "Monitoring"],
  ["insights", "Insights"],
  ["walkthrough", "Walkthrough"],
  ["method", "About and method"],
];

export default function SiteNavigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <div className="w-full border-t border-slate-200 pt-3">
      <button
        ref={toggle}
        type="button"
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-left text-sm font-medium sm:hidden"
        aria-expanded={open}
        aria-controls="section-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close sections" : "Explore sections"}
      </button>
      <nav
        id="section-navigation"
        aria-label="Main sections"
        className={`${open ? "flex" : "hidden"} mt-2 flex-col gap-1 sm:mt-0 sm:flex sm:flex-row sm:flex-wrap sm:gap-x-4`}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            toggle.current?.focus();
          }
        }}
      >
        {sections.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
            onClick={() => {
              setOpen(false);
              document.getElementById(id)?.focus({ preventScroll: true });
            }}
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
