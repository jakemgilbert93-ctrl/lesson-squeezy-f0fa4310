import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

/** Placeholder terms text — replace each body string with the final wording. */
const SECTIONS: LegalSection[] = [
  { heading: "Using Lesson Squeezy", body: "[Text to be added]" },
  { heading: "Your account", body: "[Text to be added]" },
  { heading: "Your content", body: "[Text to be added]" },
  { heading: "AI-generated content", body: "[Text to be added]" },
  { heading: "Beta service and plans", body: "[Text to be added]" },
  { heading: "Acceptable use", body: "[Text to be added]" },
  { heading: "Disclaimers and limits", body: "[Text to be added]" },
  { heading: "Changes", body: "[Text to be added]" },
  { heading: "Contact", body: "[Text to be added]" },
];

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Lesson Squeezy" },
      { name: "description", content: "The terms that apply to using Lesson Squeezy." },
      { property: "og:title", content: "Terms — Lesson Squeezy" },
      { property: "og:description", content: "The terms that apply to using Lesson Squeezy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LegalPage title="Terms" sections={SECTIONS} />,
});
