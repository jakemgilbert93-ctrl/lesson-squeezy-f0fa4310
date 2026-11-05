import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Pencil, Download, ArrowRight, Check, Clock } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { APP_CONFIG, standardsActive } from "@/config/app-config";
import { SECTION_KEYS, SECTION_LABELS, isTimed, type SectionKey } from "@/lib/lesson-schema";
import { chipFill } from "@/lib/chip-fill";
import { lessonsLine, priceLabel } from "@/lib/plan-copy";
import { useHomeSession } from "@/hooks/use-home-session";
import { HomeWorkspace } from "@/components/HomeWorkspace";
import { StandardCard } from "@/components/StandardCard";
import sampleStandard from "@/lib/home-sample-standard.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lesson Squeezy — AI lesson plans for teachers" },
      {
        name: "description",
        content:
          "Lesson Squeezy drafts an editable lesson plan from a topic or standard, then adds exit tickets, quizzes, worksheets, vocab cards, and games.",
      },
      { property: "og:title", content: "Lesson Squeezy — AI lesson plans for teachers" },
      {
        property: "og:description",
        content:
          "Lesson Squeezy drafts an editable lesson plan from a topic or standard, then adds exit tickets, quizzes, worksheets, vocab cards, and games.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** Static, hand-written sample shown on the landing page. No AI call. */
const SAMPLE: { title: string; meta: string; sections: Record<SectionKey, string>; minutes: Partial<Record<SectionKey, number>> } = {
  title: "Sample: Subtracting Fractions with Like Denominators",
  meta: "Grade 4 · Math · 45 minutes",
  minutes: { warmUp: 8, directInstruction: 15, practice: 17 },
  sections: {
    objective: "Students will subtract fractions with like denominators using fraction strips and equations.",
    materials: "Fraction strips\nWhiteboards and markers\nExit ticket slips",
    warmUp: "Show a pizza cut into 6 slices with 5 shaded. Students write the fraction on whiteboards.",
    directInstruction: "Model 6/8 − 2/8 with a bar cut into 8 parts. Cross out 2 parts and count what's left.",
    practice: "Partners solve three problems with fraction strips, then four on their own.",
    exitTicket: "Solve 5/8 − 2/8 = ___ and draw a model to show your answer.",
    differentiation: "Support: pre-cut fraction strips with halves and fourths.\nExtension: write your own fraction word problem.",
  },
};

function Index() {
  const userId = useHomeSession();
  if (userId === null) return <div className="min-h-screen"><PublicHeader /><main aria-busy="true" aria-label="Loading homepage" className="mx-auto max-w-6xl px-4 py-10"><div className="h-10 w-60 rounded-lg bg-muted" /></main></div>;
  if (userId) return <div className="min-h-screen"><PublicHeader /><HomeWorkspace userId={userId} /></div>;
  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 text-center sm:px-6 sm:pt-12">
        {APP_CONFIG.beta && (
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            Now in beta
          </div>
        )}
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Lesson plans, <span className="text-primary">drafted for you.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Enter a topic or standard, and Lesson Squeezy drafts a ready-to-edit lesson plan. Review it, save it, download it.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Start planning — it's free
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <a
            href="#sample"
            className="inline-flex items-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            See a sample lesson
          </a>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Built for teachers, by teachers.</p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">Three steps to a finished plan</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: FileText, title: "Choose a grade and subject", desc: "Enter a topic, or pick a verified Common Core standard for K–5 Math and ELA. More grades and subjects coming soon." },
            { icon: Pencil, title: "Review the draft", desc: "Edit any section, or regenerate one section at a time. " },
            { icon: Download, title: "Save or download it", desc: "Keep it in My Lessons, download a .docx, or copy the text to your clipboard." },
          ].map((step) => (
            <div key={step.title} className="rounded-xl border border-border bg-card p-6 text-left shadow-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-icon">
                <step.icon className="h-6 w-6 text-foreground" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample lesson */}
      <section id="sample" className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">A sample lesson</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          This sample has {standardsActive() ? "eight" : "seven"} sections{standardsActive() ? ", including its verified standard" : ""}.
        </p>
        <article className="mt-8 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <h3 className="font-bold text-foreground">{SAMPLE.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{SAMPLE.meta}</p>
          {standardsActive() && <div className="mt-6"><StandardCard standard={sampleStandard} /></div>}
          <div className="mt-6 space-y-5">
            {SECTION_KEYS.map((key, idx) => (
              <div key={key}>
                <h4 className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                  {SECTION_LABELS[key]}
                  {isTimed(key) && SAMPLE.minutes[key] && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium normal-case ${key === "practice" ? "bg-lavender text-foreground" : chipFill(SECTION_KEYS.filter(isTimed).indexOf(key))}`}>
                      <Clock className="h-3 w-3" aria-hidden="true" /> {SAMPLE.minutes[key]} min
                    </span>
                  )}
                </h4>
                {key === "materials" ? <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground">{SAMPLE.sections[key].split("\n").map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-1.5 whitespace-pre-line text-sm text-foreground">{SAMPLE.sections[key]}</p>}
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-6 text-center sm:p-10">
          <h2 className="text-2xl font-bold text-foreground">Start free</h2>
          <ul className="mx-auto mt-4 max-w-md space-y-2 text-left text-sm text-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {APP_CONFIG.plans.free.name} ({priceLabel("free")}): {lessonsLine("free")}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {APP_CONFIG.plans.pro.name}:{" "}
              {APP_CONFIG.beta ? `${priceLabel("pro")} — planned price during beta` : priceLabel("pro")}
            </li>
          </ul>
          <Link
            to="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-pink px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:bg-pink-deep"
          >
            See pricing
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Ready to plan your next lesson?</h2>
        <Link
          to="/auth"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Get started free
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
