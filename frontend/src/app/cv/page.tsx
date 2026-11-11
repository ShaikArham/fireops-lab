"use client";

import { useEffect } from "react";

export default function CVPage() {
  useEffect(() => {
    window.location.replace("https://shaikarham.github.io/arham-portfolio/assets/Shaik_Arham_Saquib.pdf");
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-slate-900">
      <h1 className="text-2xl font-semibold">Shaik Arham Saquib · CV</h1>
      <p className="mt-4 text-slate-600">
        Opening the original CV PDF. If it does not open automatically, use the link below.
      </p>
      <a
        className="mt-6 inline-block rounded-lg bg-teal-900 px-5 py-3 font-semibold text-white"
        href="https://shaikarham.github.io/arham-portfolio/assets/Shaik_Arham_Saquib.pdf"
      >
        View original CV (PDF)
      </a>
    </main>
  );
}
