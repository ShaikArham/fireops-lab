"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, ArrowUpRight, CheckCircle2, Code2, CreditCard, FileSearch, ShieldCheck, X } from "lucide-react";

const stages = [
  { index: "01", eyebrow: "PROCESS", title: "A payment enters the system.", description: "Follow a fictional payment batch through processing and toward settlement.", icon: CreditCard, color: "bg-[#548cff]" },
  { index: "02", eyebrow: "RECONCILE", title: "The numbers don't match.", description: "Compare the records, identify the exception and understand where it originated.", icon: FileSearch, color: "bg-[#f5b65a]" },
  { index: "03", eyebrow: "INVESTIGATE", title: "Evidence turns into a decision.", description: "Review the case, document the investigation and follow monitoring signals.", icon: ShieldCheck, color: "bg-[#64cbbd]" },
];

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
    <main id="main-content" className="min-h-screen bg-[#fff] text-[#050505]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 px-5 py-4 backdrop-blur-xl sm:px-10">
        <nav aria-label="Landing page navigation" className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link href="/" className="text-lg font-extrabold tracking-tight">FireOPS<span className="text-[#548cff]"> Lab</span></Link>
          <div className="flex items-center gap-3">
            <a href="#journey" className="hidden text-sm font-medium text-neutral-600 hover:text-black sm:inline-flex">The journey</a>
            <a href="#about" className="hidden text-sm font-medium text-neutral-600 hover:text-black sm:inline-flex">About</a>
            <Link href="/workspace/overview" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#050505] px-4 text-sm font-semibold text-white hover:bg-neutral-800">Open workspace <ArrowUpRight size={16} /></Link>
          </div>
        </nav>
      </header>
      <section className="relative isolate mx-auto grid min-h-[min(760px,88svh)] max-w-7xl items-center gap-10 overflow-hidden px-5 py-16 sm:px-10 md:grid-cols-[1.1fr_.9fr] md:py-24">
        <div className="relative z-10 motion-safe:animate-[fireops-enter_700ms_cubic-bezier(.22,1,.36,1)_both]">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dce6ff] bg-[#f0f5ff] px-4 py-2 text-xs font-semibold uppercase tracking-[.13em] text-[#2458b9]"><span className="h-2 w-2 rounded-full bg-[#548cff]"/> Independent operations simulation</p>
          <h1 className="max-w-3xl text-[clamp(3.25rem,6.7vw,6.8rem)] font-semibold leading-[.99] tracking-[-.07em]">When payments <span className="text-[#548cff]">don't match.</span></h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-[#4d5562]">A fictional payment. A real operational question. Follow the exception from processing to reconciliation, investigation and documented decisions.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/workspace/overview" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#548cff] px-6 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(84,140,255,.2)] hover:bg-[#376fdf]">Explore FireOPS <ArrowRight size={18}/></Link>
            <a href="#journey" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-black/15 px-6 py-3 font-semibold hover:bg-neutral-50">See the journey <ArrowRight size={18}/></a>
          </div>
          <p className="mt-6 text-xs text-neutral-500">Fictional records only · Not affiliated with fire.com</p>
        </div>
        <div className="relative flex min-h-[330px] items-center justify-center sm:min-h-[460px]" aria-label="Illustrative payment exception visual">
          <div aria-hidden="true" className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_60%_45%,#c8dcff_0%,#edf4ff_38%,transparent_72%)]"/>
          <div className="relative w-full max-w-md rounded-[1.7rem] border border-[#dce5f4] bg-white/95 p-5 shadow-[0_32px_90px_rgba(48,85,143,.15)] motion-safe:animate-[fireops-float_7s_ease-in-out_infinite] sm:p-7">
            <div className="flex items-center justify-between border-b border-[#e9edf4] pb-5"><span className="text-xs font-bold tracking-[.15em] text-[#68788f]">PAYMENT FLOW / DEMO</span><span className="rounded-full bg-[#fff3df] px-3 py-1 text-xs font-semibold text-[#986117]">Exception detected</span></div>
            <div className="mt-7 flex items-center justify-between gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#eaf1ff] text-[#548cff]"><CreditCard size={26}/></div>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#548cff] to-[#f5b65a]"/>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#fff3df] text-[#a56c19]"><FileSearch size={26}/></div>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#f5b65a] to-[#64cbbd]"/>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#e5f7f4] text-[#198e80]"><ShieldCheck size={26}/></div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#f5f8fd] p-4"><p className="text-xs text-[#67758b]">Processing</p><p className="mt-2 text-lg font-semibold">Complete</p></div>
              <div className="rounded-xl bg-[#fff7eb] p-4"><p className="text-xs text-[#986117]">Reconciliation</p><p className="mt-2 text-lg font-semibold">Review</p></div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#5c6a7c]"><CheckCircle2 size={15} className="text-[#198e80]"/> Illustrative data, not a live payment</div>
          </div>
        </div>
      </section>
      <section id="journey" className="border-t border-black/10 bg-[#f6f8fc] px-5 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#376fdf]">The operational journey</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-.055em] sm:text-6xl">One payment. Three decisions.</h2>
          <p className="mt-5 max-w-xl text-lg leading-7 text-[#566170]">Scroll through the story, then open the real interactive workspace.</p>
          <div className="mt-12 space-y-6 pb-8">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              return <article key={stage.index} className="fireops-scroll-card sticky overflow-hidden rounded-[1.5rem] border border-[#dce3ef] bg-white p-7 shadow-[0_20px_55px_rgba(30,53,92,.08)] sm:p-10" style={{ top: `${88 + index * 18}px` }}>
                <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold tracking-[.2em] text-[#63738c]">{stage.eyebrow}</span><span className="font-mono text-sm text-[#7e8ba0]">{stage.index} / 03</span></div>
                <div className="mt-8 grid items-center gap-7 sm:grid-cols-[1fr_auto]">
                  <div><h3 className="max-w-2xl text-3xl font-semibold tracking-[-.045em] sm:text-5xl">{stage.title}</h3><p className="mt-5 max-w-xl text-base leading-7 text-[#566170]">{stage.description}</p></div>
                  <div className={`flex h-24 w-24 items-center justify-center rounded-[1.5rem] text-white sm:h-36 sm:w-36 ${stage.color}`}><Icon size={48} strokeWidth={1.5}/></div>
                </div>
                <div className="mt-10 h-1 overflow-hidden rounded-full bg-[#e8edf5]"><div className="h-full rounded-full bg-[#548cff]" style={{width:`${(index+1)*100/3}%`}}/></div>
              </article>;
            })}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#050505] p-7 text-white sm:p-10"><div><h3 className="text-2xl font-semibold tracking-tight">Ready to investigate?</h3><p className="mt-2 text-sm text-neutral-300">Explore the real FireOPS application and its fictional records.</p></div><Link href="/workspace/overview" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#548cff] px-5 py-3 font-semibold text-white hover:bg-[#376fdf]">Launch workspace <ArrowRight size={18}/></Link></div>
        </div>
      </section>
      <section id="about" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-10 md:grid-cols-2 md:py-28">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#376fdf]">Behind the project</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">Built by Shaik Arham.</h2></div>
        <div><p className="text-lg leading-8 text-[#4d5562]">An independent portfolio project informed by experience in business intelligence, SQL, data validation and production support. FireOPS Lab explores how evidence-led thinking applies to payment operations.</p><a href="https://github.com/ShaikArham/fireops-lab" target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-11 items-center gap-2 font-semibold text-[#2458b9] underline underline-offset-4"><Code2 size={18}/> View source on GitHub <ArrowUpRight size={16}/></a></div>
      </section>
      <footer className="border-t border-black/10 px-5 py-7 text-sm text-[#647083] sm:px-10"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><span>© FireOPS Lab · Independent project · Fictional data only</span><Link href="/workspace/overview" className="font-semibold text-[#2458b9]">Enter workspace <ArrowRight size={15} className="inline"/></Link></div></footer>
      <style jsx global>{`@keyframes fireops-enter {from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}} @keyframes fireops-float {0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}} @supports (animation-timeline: view()) { @media (prefers-reduced-motion: no-preference) { .fireops-scroll-card { animation: fireops-card-reveal linear both; animation-timeline:view(); animation-range:entry 0% entry 75%; } } } @keyframes fireops-card-reveal {from{opacity:.8;transform:translateY(18px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}} @media (prefers-reduced-motion:reduce){.fireops-scroll-card{animation:none!important;transform:none!important}}`}</style>
    </main>
  );
}
