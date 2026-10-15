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
  const items = [lessonsLine(tier), regensLine(tier), ".docx download and copy to clipboard"];
  return (
    <ul className="mt-6 space-y-3">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-3 text-sm text-foreground">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
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
      a: `Each new lesson you generate counts as one. On the ${plans.free.name} plan you get ${free.monthlyLessons ?? "unlimited"} per month, and the count resets on the 1st of each month (UTC). If a generation fails, it doesn't count.`,
    },
    {
      q: "What are regenerations?",
      a: `On a saved lesson you can ask the AI to rewrite one section at a time. ${plans.free.name} includes ${free.regensPerLesson} per lesson; ${plans.pro.name} includes ${pro.regensPerLesson} per lesson. Editing text yourself never counts.`,
    },
    {
      q: "What about my data and privacy?",
      a: "Your saved lessons are tied to your account and only you can see them.",
    },
    {
      q: "Can I cancel anytime?",
      a: beta
        ? `${plans.pro.name} can't be purchased during beta, so there's nothing to cancel yet.`
        : "Yes.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
        <h1 className="text-center text-3xl font-bold text-foreground sm:text-4xl">Pricing</h1>
        {beta && (
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Lesson Squeezy is in beta. Nothing can be purchased yet.
          </p>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
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
            <p className="mt-2 text-3xl font-bold text-foreground">{priceLabel("pro")}</p>
            {beta && (
              <p className="mt-1 text-sm text-muted-foreground">Planned price during beta.</p>
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
