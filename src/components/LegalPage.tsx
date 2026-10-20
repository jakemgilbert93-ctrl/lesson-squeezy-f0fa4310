import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** A block of policy copy: a paragraph or a bulleted list. */
export type LegalBlock = { kind: "p"; text: string } | { kind: "ul"; items: string[] };

export type LegalSection = { heading: string; body: string | LegalBlock[] };

const BODY = "text-[15px] leading-relaxed text-foreground";

/** **bold**, URLs, and email addresses are turned into strong/link nodes. */
const INLINE =
  /\*\*(.+?)\*\*|(https?:\/\/[^\s]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = match.index;
    if (match[1]) {
      nodes.push(<strong key={key}>{match[1]}</strong>);
    } else if (match[2]) {
      nodes.push(
        <a key={key} href={match[2]} className="font-medium text-primary hover:underline">
          {match[2]}
        </a>,
      );
    } else if (match[3]) {
      nodes.push(
        <a key={key} href={`mailto:${match[3]}`} className="font-medium text-primary hover:underline">
          {match[3]}
        </a>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function Block({ block }: { block: LegalBlock }) {
  if (block.kind === "ul") {
    return (
      <ul className={`list-disc space-y-2 pl-5 ${BODY}`}>
        {block.items.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>
    );
  }
  return <p className={BODY}>{inline(block.text)}</p>;
}

/**
 * Shared layout for /terms and /privacy. Each route file owns its SECTIONS
 * array; to add final policy text, edit only that route's array.
 */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated?: string;
  intro?: LegalBlock[];
  sections: LegalSection[];
}) {
  return (
    <main className="mx-auto w-full max-w-[720px] px-4 py-12 sm:px-6 sm:py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
        ← Lesson Squeezy
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
      {updated && <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>}
      {intro && intro.length > 0 && (
        <div className={`mt-6 space-y-4 ${BODY}`}>{intro.map((block, i) => <Block key={i} block={block} />)}</div>
      )}
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">{section.heading}</h2>
            {typeof section.body === "string" ? (
              <p className={`mt-2 whitespace-pre-line ${BODY}`}>{section.body}</p>
            ) : (
              <div className="mt-2 space-y-4">
                {section.body.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </div>
            )}
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
