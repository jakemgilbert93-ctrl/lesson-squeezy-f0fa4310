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
- Lesson cap is checked before the AI call and incremented only after validated output; failed generations never count.
- The 7-section lesson shape lives in `src/lib/lesson-schema.ts` and one shared `LessonCanvas` component renders it for both new and saved lessons.
- Section regeneration requires a saved lesson, because the per-lesson counter is stored on the lesson row.
- Standards display is gated by standardsActive() in app-config; standard snapshots are always (re)built server-side from the DB, never from browser text.
