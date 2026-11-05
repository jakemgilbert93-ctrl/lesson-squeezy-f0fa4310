import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalBlock, type LegalSection } from "@/components/LegalPage";

/** Page copy lives here only — edit these arrays to change the page. */
const INTRO: LegalBlock[] = [
  {
    kind: "p",
    text: 'Lesson Squeezy ("we" or "us") runs a lesson planning tool for teachers at https://lessonsqueezy.com (the "Service"). It is currently in private beta. This policy explains what information we collect, how we use it, who else handles it, and the choices you have.',
  },
  { kind: "p", text: "**Effective date:** November 5th, 2026" },
  { kind: "p", text: "The Service is for teachers and other adult educators, 18 or older." },
];

const SECTIONS: LegalSection[] = [
  {
    heading: "Information we collect",
    body: [
      {
        kind: "p",
        text: "We collect your email address, your password, and what you type or save in the Service.",
      },
      {
        kind: "ul",
        items: [
          "**Account information:** your email address and password. Your password is handled by our sign-in system.",
          "**Display name (optional):** a name you can add when you sign up. It is shown only to you, in the dashboard greeting and account menu, and you can edit it. If you leave it blank, nothing is stored.",
          "**Lesson requests:** the grade, subject, and topic you choose, and any standard you enter yourself.",
          "**Saved lessons, materials, and ratings:** when you click Save, we store the lesson, its title, grade, subject, and date. We also store any materials you generate for a saved lesson (exit tickets, quizzes, worksheets, vocabulary cards, and games).",
          "**Usage records:** a count of the lessons and materials you generate each month, and short-lived timestamps that limit how quickly lessons can be generated.",
          "**Technical information:** your browser sends information such as your IP address and browser type when you visit the site. Our hosting provider handles this to deliver the Service.",
          "**Messages you send us:** if you email team@lessonsqueezy.com, including to ask to be notified when Pro opens, we receive your email address and message.",
        ],
      },
      {
        kind: "p",
        text: "Lessons you generate but do not save are never stored. They exist only in your browser until you save them, and closing the tab removes them.",
      },
      { kind: "p", text: "We do not currently collect payment information." },
    ],
  },
  {
    heading: "How we use your information",
    body: [
      { kind: "p", text: "We use your information to run the Service and nothing else." },
      {
        kind: "ul",
        items: [
          "To create and manage your account and keep you signed in.",
          "To generate your lessons and materials, save them, and let you export them.",
          "To apply the monthly lesson and materials limits and prevent abuse.",
          "To review star ratings, which we use to improve the quality of lessons.",
          "To respond to messages and requests you send us.",
          "To send account emails, such as password resets (see Cookies, tracking, and emails below).",
          "To keep the Service secure and fix problems.",
          "To comply with the law when required.",
        ],
      },
      {
        kind: "p",
        text: "We do not sell your personal information, and we do not share it for advertising.",
      },
    ],
  },
  {
    heading: "Who else handles your information",
    body: [
      {
        kind: "p",
        text: "A few outside services help us run Lesson Squeezy, and some handle your information to do so.",
      },
      {
        kind: "ul",
        items: [
          "**Lovable:** hosts the site, the database, and sign-in.",
          "**AI service:** to write your lesson, we send your request (the grade, subject, topic, and any standard you entered) through the Lovable AI Gateway to a Google AI model. Our app does not keep a log of what you type. The gateway and the AI provider may keep temporary technical logs under their own terms.",
          "**Google Fonts:** the site loads a font from Google, so your browser contacts Google when a page loads.",
          "**Squarespace and iCloud:** Squarespace manages our domain name, and iCloud handles email sent to and from team@lessonsqueezy.com.",
        ],
      },
      {
        kind: "p",
        text: "We may also disclose information if the law requires it, to protect the Service or its users, or if Lesson Squeezy is sold or transferred. In that case, we will tell you before your information becomes subject to a different privacy policy.",
      },
      { kind: "p", text: "We do not sell your personal information." },
    ],
  },
  {
    heading: "Cookies, tracking, and emails",
    body: [
      {
        kind: "p",
        text: "We do not use analytics, advertising, or tracking tools, and we do not track you across other websites.",
      },
      {
        kind: "ul",
        items: [
          "**Sign-in session:** your browser stores a sign-in session so that you stay signed in. This is the only thing we store in your browser.",
          '**Do Not Track:** because we do not track you across other websites, a "Do Not Track" signal from your browser does not change how the site works.',
          "**Account emails:** we send emails needed for your account, such as password resets.",
          "**No marketing emails:** we do not send newsletters or promotional emails.",
          "**Messages to us:** if you email us, we receive and keep your message, as described below.",
        ],
      },
    ],
  },
  {
    heading: "Keeping and deleting your information",
    body: [
      {
        kind: "p",
        text: "We keep your saved lessons until you delete them, and we delete your account within 30 days of your request.",
      },
      {
        kind: "ul",
        items: [
          "**Delete a lesson:** you can delete any saved lesson from My Lessons. After a confirmation step, the lesson, its materials, and its rating are permanently removed.",
          "**Edit your display name:** you can change it from the account menu.",
          "**Delete your account:** email team@lessonsqueezy.com. We will delete your account within 30 days. This removes your profile, saved lessons, materials, ratings, monthly usage counts, and rate-limit records.",
          "**What deletion does not reach:** temporary logs held by the AI gateway and provider, which we cannot delete, and any emails you sent us, which we delete on request.",
        ],
      },
      {
        kind: "p",
        text: "We may keep information longer only if the law requires it or we need it to resolve a dispute.",
      },
    ],
  },
  {
    heading: "Children and student information",
    body: [
      {
        kind: "p",
        text: "The Service is for adults and is not directed to children. We do not knowingly collect personal information from anyone under 18. If you believe a child has given us personal information, contact us and we will delete it.",
      },
      {
        kind: "p",
        text: "Please do not enter student names or other student information into the Service. Lesson Squeezy is built so that you do not need to.",
      },
    ],
  },
  {
    heading: "California residents, security, and contact",
    body: [
      {
        kind: "p",
        text: '**California residents.** We collect your email address, an optional display name, and the lessons and ratings you save. The services that host and run Lesson Squeezy, including our hosting provider and the AI service that writes lessons, handle this information to provide the Service. We do not sell personal information. You can edit your display name and delete saved lessons in the app, and you can ask us to delete your account by emailing team@lessonsqueezy.com. We will do so within 30 days. We do not track you across other websites, so "Do Not Track" signals do not change how the site works.',
      },
      {
        kind: "p",
        text: "**Security.** We use reasonable measures to protect your information, but no method of storage or transmission is completely secure. Each account can access only its own lessons, ratings, profile, and usage data.",
      },
      {
        kind: "p",
        text: "**Links to other sites.** Lessons may link to other websites, such as the Common Core State Standards websites. We do not control those sites or their privacy practices.",
      },
      {
        kind: "p",
        text: "**Changes.** We may update this policy. We will post the new version here and change the effective date. For significant changes, we will tell you by email or with a notice in the app.",
      },
      {
        kind: "p",
        text: "**Contact us.** Questions about this policy or requests to delete your account: team@lessonsqueezy.com.",
      },
    ],
  },
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
  component: () => (
    <LegalPage
      title="Lesson Squeezy Privacy Policy"
      intro={INTRO}
      sections={SECTIONS}
    />
  ),
});
