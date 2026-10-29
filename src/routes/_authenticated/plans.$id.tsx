import { createFileRoute, Link, useBlocker } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { LessonCanvas } from "@/components/LessonCanvas";
import { MaterialsSection } from "@/components/MaterialsSection";
import { getLessonPlan, regenerateSection, saveLessonPlan } from "@/lib/lesson-plan.functions";
import { isTimed, normalizeLesson, visibleStandard, type LessonMeta, type LessonPlanData, type SectionKey } from "@/lib/lesson-schema";
import { lessonHasChanges } from "@/lib/lesson-edits";

export const Route = createFileRoute("/_authenticated/plans/$id")({
  head: () => ({
    meta: [
      { title: "Lesson — Lesson Squeezy" },
      { name: "description", content: "View, edit, and export your saved lesson." },
      { property: "og:title", content: "Lesson — Lesson Squeezy" },
      { property: "og:description", content: "View, edit, and export your saved Lesson Squeezy lesson." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanDetailPage,
});

function PlanDetailPage() {
  const { id } = Route.useParams();
  const [plan, setPlan] = useState<LessonPlanData | null>(null);
  const [baseline, setBaseline] = useState<LessonPlanData | null>(null);
  const [meta, setMeta] = useState<LessonMeta | null>(null);
  const [regen, setRegen] = useState({ used: 0, limit: 5 });
  const [busy, setBusy] = useState<SectionKey | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const getFn = useServerFn(getLessonPlan);
  const saveFn = useServerFn(saveLessonPlan);
  const regenFn = useServerFn(regenerateSection);

  function load() {
    setLoadError(null);
    getFn({ data: { id } })
      .then((row) => {
        const loaded = normalizeLesson(row.plan);
        setPlan(loaded);
        setBaseline(loaded);
        setDirty(false);
        setJustSaved(false);
        setMeta({ grade: row.grade, subject: row.subject, durationMin: row.durationMin });
        setRegen({ used: row.regenerationCount, limit: row.regenLimit });
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load this lesson."));
  }
  useEffect(load, [id, getFn]); // eslint-disable-line react-hooks/exhaustive-deps

  useBlocker({
    shouldBlockFn: () => dirty && !window.confirm("You have unsaved changes. Leave without saving?"),
    enableBeforeUnload: () => dirty,
  });

  const [justSaved, setJustSaved] = useState(false);

  async function handleSave() {
    if (!plan || !meta || saving) return;
    setSaving(true);
    try {
      const row = await saveFn({ data: { id, ...meta, plan: plan as unknown as Record<string, unknown> } });
      const savedPlan = normalizeLesson(row.plan);
      setPlan(savedPlan);
      setBaseline(savedPlan);
      setDirty(false);
      setJustSaved(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate(key: SectionKey) {
    if (!plan) return;
    setBusy(key);
    try {
      const res = await regenFn({ data: { lessonId: id, section: key, lesson: plan as unknown as Record<string, unknown> } });
      const next: LessonPlanData = isTimed(key)
        ? { ...plan, [key]: { ...plan[key], content: res.content } }
        : { ...plan, [key]: res.content };
      next.editedSections = (plan.editedSections ?? []).filter((k) => k !== key);
      setPlan(next);
      setRegen({ used: res.regenerationCount, limit: res.regenLimit });
      setDirty(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Regeneration failed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 lg:max-w-7xl">
        <Link to="/plans" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to My Lessons
        </Link>

        <div className="mt-5 lg:grid lg:grid-cols-3 lg:items-start lg:gap-8">
          <div className="min-w-0 lg:col-span-2">
          {loadError ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm">
              <p className="text-foreground">{loadError}</p>
              <button onClick={load} className="mt-3 rounded-md border border-border px-3 py-1.5 font-medium hover:bg-accent">Try again</button>
            </div>
          ) : plan && meta && baseline ? (
            <LessonCanvas
              plan={plan}
              baseline={baseline}
              saving={saving}
              onSave={handleSave}
              meta={meta}
              onChange={(p) => {
                setPlan(p);
                setDirty(lessonHasChanges(p, baseline));
                setJustSaved(false);
              }}
              saved
              showSavedNotice={justSaved}
              actions={
                <button
                  onClick={handleSave}
                  disabled={saving || busy !== null || !dirty}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save lesson
                </button>
              }
              regen={{ ...regen, enabled: true, busy, onRegenerate: handleRegenerate }}
            />
          ) : (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading lesson…
            </p>
          )}
          </div>
          {plan && meta && baseline && !loadError && (
            <aside className="mt-6 lg:sticky lg:top-6 lg:mt-0 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1">
              <MaterialsSection
                lessonId={id}
                lessonTitle={baseline.title}
                grade={meta.grade}
                withStandardsFooter={Boolean(visibleStandard(baseline))}
              />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
