"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Code2, X } from "lucide-react";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push("/workspace/overview");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <div
        className="fixed inset-0 bg-black/60"
        aria-hidden="true"
        onClick={() => router.push("/workspace/overview")}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="film-title"
        aria-describedby="film-description"
        className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4 sm:px-8">
          <span className="text-xl font-bold">
            FireOPS <span className="text-teal-300">Lab</span>
          </span>
          <Link
            href="/workspace/overview"
            aria-label="Close introduction and explore overview"
            className="rounded-lg border border-slate-600 p-2 hover:bg-slate-800"
          >
            <X size={20} />
          </Link>
        </div>
        <div className="grid gap-7 p-6 sm:p-9 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-300">
              Independent operations simulation
            </p>
            <h1 id="film-title" className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
              When a payment succeeds but settlement doesn't match, what happens next?
            </h1>
            <p id="film-description" className="mt-4 text-sm leading-7 text-slate-300">
              Explore fictional payment processing, reconciliation, investigations and monitoring.
              Built by Shaik Arham to demonstrate evidence-led operational thinking.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/workspace/overview"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-teal-300 px-5 py-3 font-semibold text-slate-950 hover:bg-teal-200"
              >
                Explore FireOPS <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
            <video
              className="aspect-video w-full bg-slate-900 object-contain"
              controls
              playsInline
              preload="none"
              poster="videos/fireops-thumbnail.svg"
              aria-label="FireOPS Lab introduction film for Operations Analyst at Fire.com"
            >
              <source src="videos/fireops-introduction.mp4" type="video/mp4" />
              <track
                kind="captions"
                src="videos/fireops-captions.vtt"
                srcLang="en"
                label="English"
              />
              Your browser does not support HTML video.
            </video>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-slate-300">
              <span>FireOPS Lab · Operations Analyst at Fire.com · Independent project</span>
              <a
                href="videos/fireops-introduction.mp4"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-teal-300 underline underline-offset-4"
              >
                Open video directly ↗
              </a>
            </div>
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 px-6 py-4 text-xs text-slate-400 sm:px-9">
          <span>
            Fictional records only · Not affiliated with fire.com · Anonymous page, video and CV
            interactions may be summarised by email to the project owner. No visitor identity is
            collected.
          </span>
          <a
            href="https://github.com/ShaikArham/fireops-lab"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-slate-200 hover:underline"
          >
            <Code2 size={15} /> View code on GitHub
          </a>
        </footer>
      </section>
    </main>
  );
}
