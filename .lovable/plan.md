# Lesson Plan Generator — Plan

## Overview
A web app for teachers to generate effective, creative lesson plans aligned to state and district standards. Teachers sign in, select their standards, and the AI generates a full editable lesson plan they can export to PDF.

## Product decisions (confirmed)
- **Auth:** Login required from the start. This will become a paid service, so accounts gate access and store saved plans.
- **Features:** Standards picker (state → district → subject/grade → standards) · AI-generated full lesson plans · in-place editable output · PDF/document export.
- **Layout:** Split-screen — inputs on the left, generated plan live on the right.
- **Visual direction:** Light, vibrant "rainbow" palette — bright but readable on a light background, colorful accents without dark-mode heaviness.

## Tech stack
- TanStack Start (React 19, Vite, TanStack Router) — already in the project.
- **Lovable Cloud** — must be enabled first. Provides Supabase auth (email/password to start; Google/Apple optional later), Postgres DB for saved plans + profiles, and the secret store.
- **Lovable AI Gateway** — powers lesson plan generation. Calls live server-side via `createServerFn`; `LOVABLE_API_KEY` stays server-side. Model choice: a fast, capable chat model (e.g. `google/gemini-3.7-flash`) for responsive generation.
- **Payments:** Out of scope for this build. Wiring payments requires a Pro plan; we'll add it as a later milestone once the product is working. The auth + saved-plans foundation is built now so the paywall drops in cleanly later.

## Backend (Lovable Cloud)
Tables (all with RLS, grants, and policies):
1. `profiles` — `user_id` FK to `auth.users`, display name, school/district, default state. Auto-created on signup via trigger. RLS: owner read/update only.
2. `lesson_plans` — `id`, `user_id`, `title`, `standards` (jsonb), `subject`, `grade`, `duration_min`, `plan` (jsonb: objectives, materials, hook, activities, assessment, differentiation, closure), `created_at`, `updated_at`. RLS: owner full CRUD.

Standards data: seed a `standards` reference table (state, subject, grade, code, text) or store standards as curated JSON the app ships with. Start with a curated JSON dataset for a few states/subjects (e.g. Common Core ELA & Math, NGSS science) to ship faster; expand later. Standards selection feeds the AI prompt.

## AI generation
- `src/lib/ai-gateway.server.ts` — Lovable AI gateway provider helper (server-only).
- `src/lib/lesson-plan.functions.ts` — `createServerFn` (POST, `requireSupabaseAuth`) that takes selected standards + lesson params and calls the model to produce a structured plan (objectives, materials, hook, activities, assessment, differentiation, closure) via structured output (`Output.object` + zod schema). Streaming inside the handler for long generations.
- Surface gateway errors in the UI per the error contract (402 → "billing", 429 → "rate limited", etc.).

## Routes (file-based)
- `src/routes/__root.tsx` — root layout, `<Toaster />`, header/nav.
- `src/routes/index.tsx` — marketing/landing (hero, how it works, CTA to sign in).
- `src/routes/auth.tsx` — sign in / sign up (email+password). Email confirmation default → "check your email" state.
- `src/routes/_authenticated/route.tsx` — auth gate (redirect to `/auth` if no session).
- `src/routes/_authenticated/app.tsx` — the split-screen generator (main workspace).
- `src/routes/_authenticated/plans.tsx` — saved plans library (card grid).
- `src/routes/_authenticated/plans.$id.tsx` — view/edit a saved plan.
- `src/routes/reset-password.tsx` — password reset (public).

## UI / split-screen workspace
- Left panel: standards picker (state → district → subject → grade → multi-select standards), lesson params (title, duration, class size, focus), "Generate" button. Shows free-generation counter (foundation for future paywall).
- Right panel: generated plan rendered as structured, editable sections (contentEditable or form fields). "Save", "Export PDF", "Regenerate section" actions.
- Vibrant light-rainbow palette: light base (`oklch` near-white), with multi-hue accents (coral, amber, mint, sky, violet) used for section accents, tags, and CTAs — bright but on a light, airy canvas. Define as semantic tokens in `src/styles.css`.

## Export
- Client-side PDF via `react-to-print` or `@react-pdf/renderer` rendering the plan to a clean print layout. (Worker-safe, no native deps.)

## Build order
1. Enable Lovable Cloud.
2. Migrations: `profiles`, `lesson_plans`, `standards` (seed), trigger for profile auto-create, RLS + grants.
3. AI gateway helper + lesson-plan server function (test the gateway call).
4. Auth pages + `_authenticated` gate.
5. Standards picker + split-screen generator UI.
6. Saved plans library + edit page.
7. PDF export.
8. Polish, SEO head() per route, mobile responsiveness for the split-screen.

## Out of scope (future milestones)
- Payments / paywall (needs Pro plan).
- Google/Apple social login.
- Sharing plans between teachers.
- District admin dashboards.
