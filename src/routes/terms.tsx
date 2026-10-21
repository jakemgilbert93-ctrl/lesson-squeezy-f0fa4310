import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalBlock, type LegalSection } from "@/components/LegalPage";

/** Owner-supplied policy text; preserve wording exactly. */
const INTRO: LegalBlock[] = [
  {
    "kind": "p",
    "text": "These terms are the agreement between you and Lesson Squeezy (\"we\" or \"us\") for your use of https://lessonsqueezy.com (the \"Service\"). By creating an account or using the Service, you agree to them. If you do not agree, please do not use the Service."
  },
  {
    "kind": "p",
    "text": "**Effective date:** October 20, 2026"
  }
];

const SECTIONS: LegalSection[] = [
  {
    "heading": "Who may use the Service",
    "body": [
      {
        "kind": "p",
        "text": "The Service is for teachers and other educators who are 18 or older. By using it, you confirm that you are an adult. Our Privacy Policy explains how we handle your information."
      }
    ]
  },
  {
    "heading": "The Service, beta status, and plans",
    "body": [
      {
        "kind": "p",
        "text": "Lesson Squeezy is a tool that generates editable lesson plans for teachers. It is currently in private beta, which means it may change, have errors, or be unavailable at times, and we may add, change, or remove features."
      },
      {
        "kind": "ul",
        "items": [
          "**Free plan:** you can generate up to 5 lessons per calendar month. The count resets on the 1st of each month at 00:00 UTC. A generation that fails does not count against your limit.",
          "**Pro plan:** we plan to offer a low-cost paid plan. It is not available yet. We will post its price and terms before anyone is charged.",
          "**Limits and abuse:** we may limit how quickly lessons can be generated and may change these limits."
        ]
      }
    ]
  },
  {
    "heading": "Your account",
    "body": [
      {
        "kind": "p",
        "text": "You sign in with your email address and a password. Please give accurate information, keep your password private, and do not share your account with others. You are responsible for activity on your account. If you think someone else has used it, email team@lessonsqueezy.com."
      }
    ]
  },
  {
    "heading": "Your content and AI-generated lessons",
    "body": [
      {
        "kind": "p",
        "text": "You keep ownership of the content you enter and save, and you may use the lessons you generate for your teaching. You give us only the permission we need to run the Service for you, such as storing your lessons, sending your requests to the AI service that writes them, and showing and exporting your content to you."
      },
      {
        "kind": "p",
        "text": "Lessons are written by AI, so they can contain mistakes, and they may not fit your students, your curriculum, or your state's requirements. **You are responsible for reviewing every lesson for accuracy, age-appropriateness, and fit before you use it.** We do not guarantee any result from using the Service."
      },
      {
        "kind": "p",
        "text": "Please do not enter student names or other student information."
      },
      {
        "kind": "p",
        "text": "Similar lessons may be generated for other users, so we cannot promise that any lesson is unique."
      }
    ]
  },
  {
    "heading": "Common Core standards",
    "body": [
      {
        "kind": "p",
        "text": "For Grade K-5 Math and ELA, lessons show the relevant Common Core State Standard word for word, with a link to the standards online and to the official PDF. Please check any standard against the official PDF or your state's standards before relying on it."
      },
      {
        "kind": "p",
        "text": "For other grades and subjects, we do not supply standards. A standard you enter yourself is your own responsibility and is shown as entered by you."
      },
      {
        "kind": "p",
        "text": "© Copyright 2010. National Governors Association Center for Best Practices and Council of Chief State School Officers. All rights reserved."
      },
      {
        "kind": "p",
        "text": "The Common Core State Standards belong to the National Governors Association Center for Best Practices and the Council of Chief State School Officers. Lesson Squeezy is not affiliated with and is not endorsed by either organization."
      }
    ]
  },
  {
    "heading": "Acceptable use",
    "body": [
      {
        "kind": "p",
        "text": "Please use the Service only for lawful teaching and planning purposes. You agree not to:"
      },
      {
        "kind": "ul",
        "items": [
          "enter student names or other student information;",
          "create illegal, harmful, hateful, or harassing content;",
          "get around the monthly limit or other limits, or use scripts or bots to generate lessons or collect content;",
          "share your account or try to access someone else's account or data;",
          "interfere with or try to break the security of the Service; or",
          "copy, resell, or redistribute the Service itself."
        ]
      }
    ]
  },
  {
    "heading": "Our property",
    "body": [
      {
        "kind": "p",
        "text": "The Service, including its design, software, and branding, belongs to Lesson Squeezy. These terms do not give you any rights to it other than the right to use the Service."
      }
    ]
  },
  {
    "heading": "Ending your use",
    "body": [
      {
        "kind": "p",
        "text": "You can stop using the Service at any time. You can delete saved lessons from My Lessons, and you can ask us to delete your account by emailing team@lessonsqueezy.com. We will delete it within 30 days, as described in our Privacy Policy."
      },
      {
        "kind": "p",
        "text": "We may suspend or close an account that breaks these terms or puts the Service or other users at risk. During the beta, we may also change or end the Service. If we do, we will try to give you notice by email or in the app."
      }
    ]
  },
  {
    "heading": "Disclaimers, liability, and changes",
    "body": [
      {
        "kind": "p",
        "text": "**As is.** The Service is provided \"as is\" and \"as available,\" without warranties of any kind, to the fullest extent the law allows. We do not promise that it will be uninterrupted, error-free, or that lessons will be accurate or suitable for your needs."
      },
      {
        "kind": "p",
        "text": "**Limit of liability.** To the fullest extent the law allows, Lesson Squeezy is not liable for indirect, incidental, or consequential damages, or for lost data, arising from your use of the Service. Our total liability for any claim is limited to the amount you paid us in the 12 months before the claim, or $100 if you paid nothing. Some places do not allow these limits, so they may not apply to you."
      },
      {
        "kind": "p",
        "text": "**Changes.** We may update these terms. We will post the new version here and change the effective date. If you keep using the Service after a change takes effect, you accept the updated terms."
      },
      {
        "kind": "p",
        "text": "**Governing law.** These terms are governed by the laws of the State of California, without regard to its conflict-of-law rules."
      },
      {
        "kind": "p",
        "text": "**Contact.** Questions about these terms: team@lessonsqueezy.com."
      }
    ]
  }
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
  component: () => <LegalPage title="Lesson Squeezy Terms of Service" intro={INTRO} sections={SECTIONS} />,
});
