import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, FileText, Layers, Download, ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lesson Squeezy — AI lesson plans aligned to your standards" },
      {
        name: "description",
        content:
          "Generate creative, classroom-ready lesson plans from state and district standards with AI. Editable, exportable, and built for teachers.",
      },
      { property: "og:title", content: "Lesson Squeezy — AI lesson plans aligned to your standards" },
      {
        property: "og:description",
        content:
          "Generate creative, classroom-ready lesson plans from state and district standards with AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Sparkles className="h-6 w-6 text-primary" />
          Lesson <span className="text-primary">Squeezy</span>
        </Link>
        <Link
          to="/auth"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Aligned to Common Core, NGSS & state standards
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
          Lesson plans that write themselves —{" "}
          <span className="text-primary">aligned to your standards.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Pick your state and district standards, and Lesson Squeezy drafts a complete,
          creative, classroom-ready lesson plan in seconds. Edit it, save it, export it.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Start planning — it's free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-center text-3xl font-bold text-foreground">Three steps to a finished plan</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Layers,
              color: "text-primary",
              bg: "bg-primary/10",
              title: "Pick your standards",
              desc: "Filter by state, subject, and grade to select the exact standards your lesson must hit.",
            },
            {
              icon: FileText,
              color: "text-primary",
              bg: "bg-primary/10",
              title: "AI drafts the plan",
              desc: "Objectives, hook, activities, assessment, differentiation, and closure — generated and aligned.",
            },
            {
              icon: Download,
              color: "text-primary",
              bg: "bg-primary/10",
              title: "Edit & export",
              desc: "Tweak any section, save to your library, and print or export to PDF for your lesson binder.",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm"
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${step.bg}`}>
                <step.icon className={`h-6 w-6 ${step.color}`} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <h2 className="text-2xl font-bold text-foreground">Everything in one lesson plan</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Measurable objectives tied to your standards",
              "An engaging hook to open the lesson",
              "Sequenced activities with realistic timing",
              "Assessment that checks for understanding",
              "Differentiation for diverse learners",
              "A strong, reflective closure",
              "Editable sections you control",
              "One-click PDF export for your binder",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-4 w-4 text-primary" />
                </span>
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24 text-center">
        <h2 className="text-3xl font-bold text-foreground">Ready to reclaim your planning time?</h2>
        <p className="mt-3 text-muted-foreground">
          Create a free account and generate your first lesson plan today.
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Get started free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

    </div>
  );
}
