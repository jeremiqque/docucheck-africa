"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ComputerIcon, Clock01Icon, File01Icon, Globe02Icon, SparklesIcon, ChartColumnIcon, Layers01Icon, AiMagicIcon,
  CloudUploadIcon, Search01Icon, Settings02Icon, CheckmarkBadge01Icon, Notification01Icon, FolderLibraryIcon, UserIcon,
  DocumentValidationIcon, DistributionIcon, File02Icon, ShieldIcon,
  CheckmarkSquare01Icon,
  HardHatIcon,
} from "@/app/_components/icons";

const HERO_PHRASES = ["Catch it first.", "Fix it before inspection.", "Know before you build.", "Verify in seconds."];

const NAV = [
  ["How it works", "#how"],
  ["Features", "#features"],
  ["Jurisdictions", "#jurisdictions"],
  ["Customers", "#customers"],
];

const AGENCIES = [
  { src: "/landing/agencies/lasepa.webp", alt: "LASEPA, Lagos State Environmental Protection Agency" },
  { src: "/landing/agencies/ghana-building-code.webp", alt: "Ghana Building Code" },
  { src: "/landing/agencies/ghana-epa.webp", alt: "Ghana Environmental Protection Agency" },
  { src: "/landing/agencies/nesrea.webp", alt: "NESREA" },
  { src: "/landing/agencies/sabs.webp", alt: "SABS SANS 10400" },
  { src: "/landing/agencies/nhbrc.webp", alt: "NHBRC" },
];

const PROBLEMS = [
  ["One lapse halts everything", "A single expired certificate can stop an entire project. Manual tracking means you find out far too late to act."],
  ["Nothing covers the full lifecycle", "No single tool follows a project from pre-construction permits all the way to post-construction handover."],
  ["Built for everywhere but here", "No existing AI tool encodes COREN, NHBRC, or EPA Ghana, so they get checked by hand, or not at all."],
];

const STEPS = [
  ["Upload", "A PDF, scan or phone photo. Anything legible works."],
  ["Read", "The document is transcribed, classified and its key fields extracted."],
  ["Check", "Six rules run against the requirements for your jurisdiction."],
  ["Verdict", "Pass, Warning or Fail in plain English, with an alert if it matters."],
];

const TABS = [
  {
    key: "Read & classify",
    title: "It reads the document so you don't have to",
    body: "Upload a scan or phone photo. It's transcribed, categorised, and reduced to the eight fields that matter.",
    points: [
      "Classifies into 8 document types automatically",
      "Works on poor-lighting field photos",
      "Pulls issue date, expiry, authority, holder & more",
    ],
    card: { name: "COREN Certificate", meta: "Drop COREN_Certificate.pdf", match: "98% match" },
  },
  {
    key: "Rules engine",
    title: "Six rules on every single document",
    body: "Expiry, mandatory fields, issuing authority, jurisdiction, issue date and date sequence, each checked against the requirements for the project's phase.",
    points: [
      "Jurisdiction-specific rule sets out of the box",
      "Pass, warning or fail with a plain-English reason",
      "Catches expired, future-dated and mismatched documents",
    ],
    card: { name: "Building Permit", meta: "Verdict computed", match: "Pass" },
  },
  {
    key: "Expiry alerts",
    title: "Warnings land before problems do",
    body: "Every document with an expiry date is tracked. Automatic email alerts go out at 90, 60 and 30 days so nothing lapses unnoticed before an inspection.",
    points: [
      "Automatic email alerts at 90 / 60 / 30 days",
      "Per-project and per-document tracking",
      "Renewals flagged while there is still time",
    ],
    card: { name: "Insurance Certificate", meta: "Expires in 30 days", match: "Alert sent" },
  },
  {
    key: "Audit packs",
    title: "Clearance reports & handover audit packages",
    body: "Generate a complete, timestamped record of every check on demand, formatted and ready for inspection or project handover.",
    points: [
      "Audit packages, generated on demand",
      "Complete, timestamped verification history",
      "Ready for municipal submission and handover",
    ],
    card: { name: "Audit Package", meta: "12 documents verified", match: "Ready" },
  },
];

const JURISDICTIONS = [
  ["Nigeria", "Pre and post construction requirements under Nigeria's national engineering and environmental frameworks.", ["COREN", "NBC", "NSITF", "NAICOM", "NESREA"]],
  ["Ghana", "Ghana Building Code requirements, including LUSPA development permits and EPA environmental approvals.", ["EPA Ghana", "GNFS", "Ghana Building Code", "LUSPA"]],
  ["South Africa", "NHBRC enrolment, SANS 10400 building compliance and DFFE environmental authorisation.", ["NHBRC", "SANS 10400", "FSCA", "DFFE"]],
];

const STATS = [
  ["~90%", "Classification accuracy in our testing"],
  ["<30s", "From upload to a clear verdict"],
  ["3", "Markets supported out of the box"],
  ["6", "Compliance checks on every document"],
];

const TESTIMONIALS = [
  {
    tag: "Crisis avoided",
    icon: ShieldIcon,
    quote: "An expired COREN cert shut us down for a week once. Now the alerts reach me 90 days out, so it never becomes a problem on site.",
    name: "Adebayo Okonkwo",
    role: "Project Manager · Lagos, Nigeria",
  },
  {
    tag: "Field-proven",
    icon: CheckmarkBadge01Icon,
    quote: "It read a GhIE licence correctly from a photo I took in bad lighting. That kind of accuracy is what makes it usable out on a real site.",
    name: "Kwame Asante",
    role: "Site Engineer · Accra, Ghana",
  },
  {
    tag: "Days \u2192 seconds",
    icon: Clock01Icon,
    quote: "Putting an audit package together used to take two days. DocuCheck produces it in seconds, already formatted for municipal submission.",
    name: "Nomvula Mokoena",
    role: "Compliance Officer · Cape Town, South Africa",
  },
];

const BLOBS = ["/landing/blob-2.svg", "/landing/blob-4.svg", "/landing/blob-5.svg", "/landing/blob-6.svg", "/landing/blob-7.svg"];

const PROBLEM_ICONS = [Clock01Icon, File01Icon, Globe02Icon];
const STEP_ICONS = [CloudUploadIcon, Search01Icon, Settings02Icon, CheckmarkBadge01Icon];
const TAB_ICONS = [DocumentValidationIcon, DistributionIcon, Clock01Icon, File02Icon];

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [tab, setTab] = useState(0);
  const active = TABS[tab];
  const main = useRef(null);

  useGSAP(
    () => {
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.utils.toArray("[data-animate]").forEach((sec) => {
        const targets = sec.children.length ? Array.from(sec.children) : [sec];
        gsap.from(targets, {
          opacity: 0,
          y: 28,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: { trigger: sec, start: "top 82%" },
        });
      });

      gsap.utils.toArray(".stat-value").forEach((el) => {
        const raw = el.getAttribute("data-value") || "";
        const m = raw.match(/^(\D*)(\d+)(\D*)$/);
        if (!m) return;
        const pre = m[1];
        const num = Number(m[2]);
        const suf = m[3];
        const obj = { v: 0 };
        el.textContent = pre + "0" + suf;
        gsap.to(obj, {
          v: num,
          duration: 1.3,
          ease: "power1.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
          onUpdate: () => {
            el.textContent = pre + Math.round(obj.v) + suf;
          },
        });
      });
    },
    { scope: main }
  );


  return (
    <main ref={main} className="min-h-screen bg-paper text-ink">
      <CursorFollower />
      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 border-b border-cloud bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 lg:px-10">
          <Link href="/" className="flex items-center gap-2">
            <img src="/landing/logo.svg" alt="DocuCheck Africa" className="h-6 w-auto" />
          </Link>
          <nav className="hidden items-center gap-9 text-[15px] text-graphite md:flex">
            {NAV.map(([l, h]) => (
              <a key={l} href={h} className="transition-colors hover:text-ink">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hidden rounded-none border border-ink bg-paper px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-mist md:block">Log in</Link>
            <Link href="/login" className="hidden md:block rounded-none bg-[linear-gradient(90deg,#1a1a1a_0%,#7e7e7e_100%)] ring-1 ring-[#525252]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_3px_rgba(0,0,0,0.15)] px-5 py-2 text-sm font-medium text-paper transition-[filter] hover:brightness-110">Start free</Link>
            <button type="button" onClick={() => setMenu((o) => !o)} aria-label="Menu" className="grid h-9 w-9 place-items-center rounded-none text-ink hover:bg-mist md:hidden">
              <span className="text-xl leading-none">{menu ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>
        {menu && (
          <div className="border-t border-cloud bg-paper px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-3 text-[15px] text-graphite">
              {NAV.map(([l, h]) => <a key={l} href={h} onClick={() => setMenu(false)}>{l}</a>)}
              <Link
                href="/login"
                onClick={() => setMenu(false)}
                className="mt-2 flex w-full items-center justify-between rounded-none border border-ink bg-paper px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-mist"
              >
                Log in <span aria-hidden="true">&rsaquo;</span>
              </Link>
              <Link
                href="/login"
                onClick={() => setMenu(false)}
                className="flex w-full items-center justify-between rounded-none bg-[linear-gradient(90deg,#1a1a1a_0%,#7e7e7e_100%)] px-5 py-3 text-sm font-medium text-paper"
              >
                Start free <span aria-hidden="true">&rsaquo;</span>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section data-animate className="mx-auto max-w-[1240px] px-5 pb-8 pt-12 text-center lg:px-10 lg:pt-16">
        <span className="inline-flex items-center gap-2 rounded-none border border-cloud bg-paper px-4 py-1.5 text-sm text-graphite">
          <AiMagicIcon size={15} className="text-gold" /> AI compliance for African construction
        </span>
        <h1 className="mx-auto mt-7 max-w-[18ch] font-display text-[34px] font-bold leading-[1.05] tracking-tight sm:text-[50px]">
          One expired permit can shut your whole site.
        </h1>
        <p className="relative mx-auto mt-3 inline-block min-w-[6ch]">
          <Typewriter />
        </p>
        <p className="mx-auto mt-5 max-w-[62ch] text-base leading-relaxed text-graphite">
          Upload any compliance document. DocuCheck checks it against the rules in Nigeria, Ghana and South Africa and returns a clear verdict in under 30 seconds.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/login" className="inline-flex w-full items-center justify-center group gap-2 rounded-none bg-[linear-gradient(90deg,#1a1a1a_0%,#7e7e7e_100%)] ring-1 ring-[#525252]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_3px_rgba(0,0,0,0.15)] px-6 py-3 text-base font-medium text-paper transition-[filter] hover:brightness-110 sm:w-auto">
            Verify a document free <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
          </Link>
          <a href="#how" className="inline-flex w-full items-center justify-center rounded-none border border-ink px-6 py-3 text-base font-medium text-ink transition-colors hover:bg-mist sm:w-auto">
            See how it works
          </a>
        </div>
        <p className="mt-5 text-sm text-slate">Free to try. No credit card needed.</p>
        <p className="mt-6 text-sm text-slate">Trusted by site teams &amp; compliance officers across three markets</p>

        {/* product preview (video) */}
        <div className="mx-auto mt-10 w-full max-w-[1240px] overflow-hidden rounded-none border border-cloud bg-mist shadow-[rgba(26,26,26,0.12)_0px_30px_70px]">
          <video
            className="aspect-video w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/landing/hero-poster.jpg"
          >
            <source src="/landing/hero.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* ── AGENCY STRIP (marquee) ── */}
      <section data-animate className="relative overflow-hidden border-y border-cloud bg-paper py-12">
        <p className="micro-label text-center">Knows the rulebooks for</p>
        <div className="relative mt-8">
          <div className="flex w-max animate-marquee">
            {[0, 1].map((g) => (
              <div key={g} className="flex shrink-0" aria-hidden={g === 1}>
                {AGENCIES.map((a, i) => (
                  <div key={i} className="flex w-[200px] items-center justify-center border-l border-cloud px-6 sm:w-[240px]">
                    <img src={a.src} alt={a.alt} loading="lazy" decoding="async" className="h-16 w-auto object-contain mix-blend-multiply sm:h-20" />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-paper to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-paper to-transparent" />
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section data-animate className="mx-auto max-w-[1240px] px-5 py-24 text-center lg:px-10">
        <SectionPill icon={ComputerIcon}>The problem</SectionPill>
        <h2 className="mx-auto mt-5 max-w-[34ch] font-display text-[32px] font-bold leading-tight tracking-tight">
          Compliance still lives on spreadsheets until a site gets shut down.
        </h2>
        <p className="mx-auto mt-4 max-w-[60ch] text-base text-graphite">
          Permits expire quietly. The gap shows up at inspection, not before.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-5 text-left md:grid-cols-3">
          {PROBLEMS.map(([t, d], i) => {
            const Icon = PROBLEM_ICONS[i];
            return (
              <div key={t} className="rounded-none border border-cloud bg-paper p-7 transition-all duration-200 hover:-translate-y-1 hover:border-ink">
                <Icon size={26} className="text-ink" />
                <h3 className="mt-5 font-display text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate">{d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section data-animate id="how" className="border-t border-cloud bg-mist">
        <div className="mx-auto max-w-[1240px] px-5 py-24 text-center lg:px-10">
          <SectionPill icon={Layers01Icon}>How it works</SectionPill>
          <h2 className="mt-5 font-display text-[32px] font-bold leading-tight tracking-tight">From upload to verdict in four steps</h2>
          <p className="mx-auto mt-4 max-w-[58ch] text-base text-graphite">Drop in a document and the pipeline handles the rest. No setup, no manual data entry.</p>
          <div className="mt-12 grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d], i) => {
              const Icon = STEP_ICONS[i];
              return (
                <div key={t} className="rounded-none border border-cloud bg-paper p-6 transition-all duration-200 hover:-translate-y-1 hover:border-ink">
                  <div className="flex items-center justify-between">
                    <Icon size={24} className="text-ink" />
                    <span className="font-display text-sm font-bold text-slate">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate">{d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHAT IT DOES (tabs) ── */}
      <section data-animate id="features" className="mx-auto max-w-[1240px] px-5 py-24 lg:px-10">
        <div className="text-center">
          <SectionPill icon={SparklesIcon}>What it does</SectionPill>
          <h2 className="mx-auto mt-5 max-w-[32ch] font-display text-[32px] font-bold leading-tight tracking-tight">
            Everything that keeps a project clearance-ready, in one place.
          </h2>
          <p className="mx-auto mt-4 max-w-[60ch] text-base text-graphite">
            Pre and post construction. Three jurisdictions. One system that actually understands the documents.
          </p>
        </div>
        <div className="mt-10 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1 bg-mist p-1.5">
            {TABS.map((t, i) => {
              const Icon = TAB_ICONS[i];
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(i)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${i === tab ? "bg-paper text-ink shadow-[rgba(26,26,26,0.08)_0px_1px_2px]" : "text-graphite hover:text-ink"}`}
                >
                  <Icon size={18} /> {t.key}
                </button>
              );
            })}
          </div>
        </div>
        <div key={tab} className="mt-8 grid grid-cols-1 items-center gap-8 rounded-none border border-cloud bg-mist p-7 sm:p-10 lg:grid-cols-2 animate-fadein">
          <div>
            <h3 className="font-display text-[26px] font-bold tracking-tight">{active.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-graphite">{active.body}</p>
            <ul className="mt-6 space-y-3">
              {active.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-graphite">
                  <CheckmarkSquare01Icon size={18} className="mt-0.5 shrink-0 text-pass" /> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-none border border-cloud bg-paper p-5">
            <div className="flex items-center gap-1.5 pb-3">
              <span className="h-2.5 w-2.5 rounded-pill bg-cloud" />
              <span className="h-2.5 w-2.5 rounded-pill bg-cloud" />
              <span className="h-2.5 w-2.5 rounded-pill bg-cloud" />
            </div>
            <div className="grid h-32 place-items-center rounded-none border border-dashed border-cloud bg-mist text-sm text-slate">
              {active.card.meta}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-none bg-mist px-4 py-3">
              <span className="text-sm font-medium text-ink">{active.card.name}</span>
              <span className="text-sm font-semibold text-pass">{active.card.match}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── JURISDICTIONS ── */}
      <section data-animate id="jurisdictions" className="border-t border-cloud bg-mist">
        <div className="mx-auto max-w-[1240px] px-5 py-24 text-center lg:px-10">
          <SectionPill icon={Globe02Icon}>Supported jurisdictions</SectionPill>
          <h2 className="mt-5 font-display text-[32px] font-bold leading-tight tracking-tight">Built for Africa's regulatory reality</h2>
          <p className="mx-auto mt-4 max-w-[62ch] text-base text-graphite">DocuCheck ships knowing the specific frameworks of three markets, no configuration required.</p>
          <div className="mt-12 grid grid-cols-1 gap-5 text-left md:grid-cols-3">
            {JURISDICTIONS.map(([name, body, tags]) => (
              <div key={name} className="rounded-none border border-cloud bg-paper p-7 transition-all duration-200 hover:-translate-y-1 hover:border-ink">
                <h3 className="font-display text-xl font-semibold">{name}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate">{body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-none bg-mist px-3 py-1 text-xs font-medium text-graphite">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BY THE NUMBERS ── */}
      <section data-animate className="mx-auto max-w-[1240px] px-5 py-24 text-center lg:px-10">
        <SectionPill icon={ChartColumnIcon}>By the numbers</SectionPill>
        <h2 className="mt-5 font-display text-[32px] font-bold leading-tight tracking-tight">Tuned for accuracy, speed and scale</h2>
        <div className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map(([v, l]) => (
            <div key={l}>
              <p data-value={v} className="stat-value font-display text-[48px] font-bold leading-none text-ink">{v}</p>
              <p className="mt-3 text-sm text-slate">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section data-animate id="customers" className="border-t border-cloud bg-mist">
        <div className="mx-auto max-w-[1240px] px-5 py-24 lg:px-10">
          <div className="text-center">
            <SectionPill icon={SparklesIcon}>Testimonials</SectionPill>
            <h2 className="mx-auto mt-5 max-w-[32ch] font-display text-[32px] font-bold leading-tight tracking-tight">
              The people doing the work, on what changed
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => {
              const Icon = t.icon;
              return (
                <figure key={t.name} className="flex flex-col border border-cloud bg-paper p-7 transition-all duration-200 hover:-translate-y-1 hover:border-ink">
                  <span className="inline-flex w-fit items-center gap-1.5 bg-pass-wash px-2.5 py-1 text-xs font-medium text-pass">
                    <Icon size={14} /> {t.tag}
                  </span>
                  <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-graphite">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-6">
                    <p className="font-display text-base font-semibold text-ink">{t.name}</p>
                    <p className="mt-0.5 text-sm text-slate">{t.role}</p>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section data-animate className="bg-gold">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-8 px-5 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="max-w-[620px]">
            <h2 className="font-display text-[32px] font-bold leading-tight tracking-tight text-ink">
              Stop chasing certificates. Start trusting the verdict.
            </h2>
            <p className="mt-4 text-base text-ink/80">
              Join construction teams across Africa verifying documents automatically, ahead of every inspection.
            </p>
            <p className="mt-3 text-sm font-medium text-ink/70">Free to try. No credit card needed.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex items-center justify-center group gap-2 rounded-none bg-[linear-gradient(90deg,#1a1a1a_0%,#7e7e7e_100%)] ring-1 ring-[#525252]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_3px_rgba(0,0,0,0.15)] px-6 py-3 text-base font-medium text-paper transition-[filter] hover:brightness-110">
              Verify a document free <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
            </Link>
            <a href="mailto:support@jeremiahalalade.me" className="inline-flex items-center justify-center rounded-none border border-ink px-6 py-3 text-base font-medium text-ink transition-colors hover:bg-gold-deep">
              Book a demo
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer data-animate className="border-t-[3px] border-gold bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-10">
          {/* Agency blobs flanking the central DocuCheck mark */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6">
            <img src="/landing/blob-2.svg" alt="COREN" loading="lazy" decoding="async" className="h-12 w-auto object-contain" />
            <img src="/landing/blob-4.svg" alt="Nigeria" loading="lazy" decoding="async" className="h-12 w-auto object-contain" />
            <img src="/landing/logo-3d.webp" alt="DocuCheck Africa" loading="lazy" decoding="async" className="mx-2 h-48 w-auto object-contain sm:h-72 lg:h-96" />
            <img src="/landing/blob-6.svg" alt="NHBRC" loading="lazy" decoding="async" className="h-12 w-auto object-contain" />
            <img src="/landing/blob-7.svg" alt="Ghana" loading="lazy" decoding="async" className="h-12 w-auto object-contain" />
            <img src="/landing/blob-5.svg" alt="South Africa" loading="lazy" decoding="async" className="h-12 w-auto object-contain" />
          </div>
          {/* Brand + copyright */}
          <div className="mt-12 flex flex-col gap-4 border-t border-cloud pt-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-[420px]">
              <div className="flex items-center gap-2">
                <img src="/landing/logo.svg" alt="" className="h-5 w-auto" />
                <span className="font-display text-lg font-bold tracking-tight">DocuCheck Africa</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                AI-assisted compliance verification for construction projects in Nigeria, Ghana and South Africa.
              </p>
            </div>
            <p className="text-xs text-slate">&copy; 2026 DocuCheck Africa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Typewriter() {
  const [text, setText] = useState(HERO_PHRASES[0]);
  const [i, setI] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const current = HERO_PHRASES[i];
    let delay = deleting ? 45 : 95;
    if (!deleting && text === current) delay = 1500;
    else if (deleting && text === "") delay = 350;
    const t = setTimeout(() => {
      if (!deleting && text === current) {
        setDeleting(true);
      } else if (deleting && text === "") {
        setDeleting(false);
        setI((prev) => (prev + 1) % HERO_PHRASES.length);
      } else {
        setText(deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1));
      }
    }, delay);
    return () => clearTimeout(t);
  }, [text, deleting, i]);

  return (
    <>
      <span className="sr-only">Catch it first.</span>
      <span aria-hidden="true" className="absolute inset-x-[-6px] bottom-1 top-2 -z-0 -rotate-1 rounded-none bg-gold" />
      <span aria-hidden="true" className="relative font-display text-[26px] font-bold tracking-tight text-ink sm:text-[38px]">
        {text}
        <span className="ml-0.5 inline-block h-[0.85em] w-[3px] translate-y-[2px] animate-blink bg-ink align-baseline" />
      </span>
    </>
  );
}

function CursorFollower() {
  const ref = useRef(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) return;
    setOn(true);
    const move = (e) => {
      const el = ref.current;
      if (el) el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    };
    const down = () => { const el = ref.current; if (el) el.style.setProperty("--cs", "0.8"); };
    const up = () => { const el = ref.current; if (el) el.style.setProperty("--cs", "1"); };
    document.documentElement.classList.add("cursor-none");
    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      document.documentElement.classList.remove("cursor-none");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[100]" style={{ willChange: "transform", opacity: on ? 1 : 0 }}>
      <span className="block transition-transform duration-150 ease-out [transform:translate(-50%,-50%)_scale(var(--cs,1))]">
        <HardHatIcon size={28} className="text-ink drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" />
      </span>
    </div>
  );
}

function SectionPill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-none border border-cloud bg-paper px-3.5 py-1.5 text-sm font-medium text-graphite">
      {Icon ? <Icon size={15} className="text-graphite" /> : <span className="h-1.5 w-1.5 rounded-pill bg-gold" />} {children}
    </span>
  );
}
