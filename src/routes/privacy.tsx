import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

/** Placeholder policy text — replace each body string with the final wording. */
const SECTIONS: LegalSection[] = [
  { heading: "What we collect", body: "[Text to be added]" },
  { heading: "How we use it", body: "[Text to be added]" },
  { heading: "AI processing of lesson content", body: "[Text to be added]" },
  { heading: "Service providers", body: "[Text to be added]" },
  { heading: "Data retention and deletion", body: "[Text to be added]" },
  { heading: "Children and student information", body: "[Text to be added]" },
  { heading: "Your choices", body: "[Text to be added]" },
  { heading: "Contact", body: "[Text to be added]" },
];

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Lesson Squeezy" },
      { name: "description", content: "How Lesson Squeezy handles your data." },
      { property: "og:title", content: "Privacy — Lesson Squeezy" },
      { property: "og:description", content: "How Lesson Squeezy handles your data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LegalPage title="Privacy" updated="October 20, 2026" sections={SECTIONS} />,
});
