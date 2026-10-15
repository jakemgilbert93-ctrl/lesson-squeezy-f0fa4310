import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Lesson Squeezy" },
      { name: "description", content: "Lesson Squeezy terms of service." },
      { property: "og:title", content: "Terms — Lesson Squeezy" },
      { property: "og:description", content: "Lesson Squeezy terms of service." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-6 py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Lesson Squeezy</Link>
      <h1 className="mt-4 text-3xl font-bold text-foreground">Terms</h1>
      <p className="mt-3 text-muted-foreground">Coming soon.</p>
    </main>
  ),
});
