import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { APP_CONFIG, limitsFor, type PlanTier } from "@/config/app-config";
import { lessonsLine, priceLabel, regensLine } from "@/lib/plan-copy";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Lesson Squeezy" },
      { name: "description", content: "Lesson Squeezy Free and Pro plans, limits, and FAQ." },
      { property: "og:title", content: "Pricing — Lesson Squeezy" },
      { property: "og:description", content: "Lesson Squeezy Free and Pro plans, limits, and FAQ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PricingPage,
});

function Features({ tier }: { tier: PlanTier }) {
  const limits = limitsFor(tier);
  const items = [
    lessonsLine(tier),
    tier === "free"
      ? `${limits.monthlyMaterials} materials sample a month (pick any one of the five)`
      : `${limits.monthlyMaterials} materials a month (exit tickets, quizzes, worksheets, vocabulary cards, and games)`,
    tier === "free" ? regensLine(tier) : `${limits.regensPerLesson} regenerations per lesson section and per material`,
    "Word (.docx) downloads, saved lessons on your account, and copy to clipboard",
  ];
  return (
    <ul className="mt-6 space-y-3">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-3 text-sm text-foreground">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-icon">
            <Check className="h-3.5 w-3.5 text-foreground" aria-hidden="true" />
          </span>
          {f}
        </li>
      ))}
    </ul>
  );
}

function PricingPage() {
  const { plans, beta, feedbackEmail } = APP_CONFIG;
  const free = limitsFor("free");
  const pro = limitsFor("pro");
  const faq = [
    {
      q: "What counts as a lesson?",
      a: `Each new lesson you generate counts as one. Free includes ${free.monthlyLessons} a month and Pro includes ${pro.monthlyLessons}. Your count resets on the 1st of each month (UTC). If a generation fails, it doesn't count. Deleting a lesson doesn't give the count back, so a deleted lesson still counts toward that month's total.`,
    },
    {
      q: "What are materials?",
      a: "Materials are classroom-ready extras made from a saved lesson: an exit ticket, a quiz, a worksheet, vocabulary cards, or a game. Each one is built directly from the lesson you generated, using its objective, standard, instruction, and practice, so the vocabulary and examples match what you taught. Materials aren't pulled from outside websites or other teachers' work.",
    },
    {
      q: "How many materials do I get?",
      a: `Free includes ${free.monthlyMaterials} materials sample a month, and you choose which of the five to make. Pro includes ${pro.monthlyMaterials} a month. Each item you generate counts as one, and your count resets on the 1st of each month (UTC). If a generation fails, it doesn't count.`,
    },
    {
      q: "What are regenerations?",
      a: `On a saved lesson, you can ask the AI to rewrite one section at a time. You can also regenerate any material you've made. Free includes ${free.regensPerLesson} per lesson and per material, and Pro includes ${pro.regensPerLesson}. Editing text yourself never counts.`,
    },
    {
      q: "Does regenerating a material use up my monthly materials?",
      a: "No. Regenerating an item only counts toward that item's regeneration limit, not your monthly materials count.",
    },
    {
      q: "What do I get when I download a material?",
      a: "Quizzes, worksheets, and exit tickets come as two Word files: a student copy with no answers, and an answer key or teacher notes. Vocabulary cards download as a cut-out sheet. Games come as cut-out student cards and a teacher guide. The student files never include answers.",
    },
    {
      q: "How accurate are the answer keys?",
      a: "Each quiz, worksheet, and game includes worked solutions to make checking quick. AI can make mistakes, especially in math, so please review the answer key before using it with students.",
    },
    {
      q: "Can I edit what the AI creates?",
      a: "Yes. You can edit your lessons directly, and everything can be copied to your clipboard or downloaded as a Word file to edit further.",
    },
    {
      q: "What about my data and privacy?",
      a: "Your saved lessons and materials are tied to your account, and only you can see them.",
    },
    {
      q: "How much will Pro cost?",
      a: `Pro is planned at ${priceLabel("pro")} or $90/year (a $30 savings). Pro can't be purchased during beta. Select "Email me when Pro opens" and we'll let you know.`,
    },
    {
      q: "When does Pro open?",
      a: "Pro can't be purchased during beta. Select \"Email me when Pro opens\" and we'll let you know.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Pro can't be purchased during beta, so there's nothing to cancel yet.",
    },
  ];

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
        <h1 className="text-center text-3xl font-bold text-foreground sm:text-4xl">Simple pricing for busy teachers</h1>
        {beta && (
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Start free. Pro is coming after beta.
          </p>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-foreground">{plans.free.name}</h2>
            <p className="mt-2 text-3xl font-bold text-foreground">{priceLabel("free")}</p>
            <Features tier="free" />
            <Link
              to="/auth"
              className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Get started free
            </Link>
          </section>

          <section className="rounded-2xl border-2 border-primary bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-foreground">{plans.pro.name}</h2>
            <p className="mt-2 text-3xl font-bold text-foreground">{priceLabel("pro")} or $90/year</p>
            {beta && (
              <p className="mt-1 text-sm text-muted-foreground">Planned prices during beta.</p>
            )}
            <Features tier="pro" />
            {beta && (
              <>
                <button
                  type="button"
                  disabled
                  className="mt-8 inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground"
                >
                  Coming after beta
                </button>
                <a
                  href={`mailto:${feedbackEmail}?subject=${encodeURIComponent("Email me when Pro opens")}`}
                  className="mt-3 block text-center text-sm font-semibold text-primary hover:underline"
                >
                  Email me when Pro opens
                </a>
              </>
            )}
          </section>
        </div>

        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground">FAQ</h2>
          <dl className="mt-6 space-y-6">
            {faq.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-foreground">{f.q}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
