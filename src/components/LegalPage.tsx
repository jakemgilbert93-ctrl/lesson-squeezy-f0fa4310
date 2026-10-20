import { Link } from "@tanstack/react-router";

export type LegalSection = { heading: string; body: string };

/**
 * Shared layout for /terms and /privacy. Each route file owns its SECTIONS
 * array; to add final policy text, edit only that route's array.
 */
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  return (
    <main className="mx-auto w-full max-w-[720px] px-4 py-12 sm:px-6 sm:py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
        ← Lesson Squeezy
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">{section.heading}</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-foreground">{section.body}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        Questions? Email{" "}
        <a href="mailto:team@lessonsqueezy.com" className="font-medium text-primary hover:underline">
          team@lessonsqueezy.com
        </a>
        .
      </p>
    </main>
  );
}
