<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- All usage limits, option lists, input limits and the AI model id live in `src/config/app-config.ts`; never hardcode them elsewhere, so the owner can tune them in one place.
- Usage counters, rate limiting and plan tier are enforced in the database (SECURITY DEFINER functions + BEFORE triggers that reject changes from the `authenticated` role), because serverless workers share no memory and browsers must never edit these values.
- Database rate-limit parameters are clamped to the approved safety ceiling/floor independently of client configuration, so direct callers cannot weaken enforcement.
- Ratings reference the unique profile user ID with cascading deletion; profiles already cascade from Auth, preserving account cleanup without adding a managed-schema foreign key.
- Lesson read and delete functions share the UUID input schema in `src/lib/lesson-id.ts`, so malformed IDs are rejected before querying.
- Lesson cap is checked before the AI call and incremented only after validated output; failed generations never count.
- The 7-section lesson shape lives in `src/lib/lesson-schema.ts` and one shared `LessonCanvas` component renders it for both new and saved lessons.
- Section edit controls compare page text with an immutable generated/last-successfully-saved snapshot and use the existing whole-lesson save handler; cancellation restores only that section so other edits remain intact.
- Monthly usage explanations share a UTC-calendar-month comparison of existing lesson creation timestamps, never infer deleted counts or compare all-time saved totals.
- Section regeneration requires a saved lesson, because the per-lesson counter is stored on the lesson row.
- Verified standards display is gated by standardsActive() in app-config; snapshots are refreshed server-side with grade/subject validation on generation, save and read. Teacher-entered text is stored separately as teacherStandard for unsupported grades/subjects, so user text can never be labeled verified.
- Lesson document creation is separate from browser download so automated tests can inspect the same Word document users receive.
- The public homepage resolves identity before mounting its signed-in workspace; private reads use existing protected server functions from client queries keyed by user ID, never the public loader.
- The static public sample standard is an exact source-file extract verified against the database, avoiding anonymous access to the protected standards table; live lesson snapshots remain server-built.
- Display names are read and edited through authenticated owner-scoped profile functions; profiles are the canonical current name, and the greeting and Account page share a user-ID-keyed query so edits stay private and refresh together.
- Sign Up checks legal agreement in the form and a shared submission guard before calling auth, so disabled-button bypasses cannot submit an unchecked form.
- Authentication email templates share an email-safe brand module and PNG logo; keep the scaffolded managed handler responsible for verification and sending, because email clients and the Worker need compatible rendering.
- Account settings live on the protected /account page (header Account links there); password changes go through the browser auth client with the current password, and sign-up, reset and Account all use the one shared rule, messages and checklist in src/lib/password-change.ts so they cannot drift; the minimum length lives in app-config.
- Tests run under Bun's test runner, so test files import from `bun:test`; its types come from the minimal ambient declaration in `src/types/bun-test.d.ts` instead of the `@types/bun` package, because that package's global `fetch` typing breaks the auto-generated Supabase client files.
- Capture signup callback markers before SDK initialization in the router, never store callback tokens, and consume markers on the destination page; shared resend controls persist their deadline per tab so switching screens cannot reset the cooldown.
- Materials are separate owner-scoped rows per saved lesson and item type; authenticated handlers verify both owners before any privileged work, and a service-role-only RPC reserves regenerations using the protected profile tier and config caps so clients cannot weaken enforcement.
- AI helpers return validated data plus usage and record each attempted call in a server-only log, including null usage when unavailable; materials stream to the server and run one item at a time without changing the existing lesson provider.
