import { createFileRoute, Link, useBlocker } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Save, Wand2, AlertCircle } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { LessonCanvas } from "@/components/LessonCanvas";
import { APP_CONFIG, gradeLabel } from "@/config/app-config";
import {
  generateLessonPlan,
  getUsage,
  regenerateSection,
  saveLessonPlan,
  type Usage,
} from "@/lib/lesson-plan.functions";
import { isTimed, type LessonPlanData, type SectionKey } from "@/lib/lesson-schema";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "New lesson — Teacher's Pet" },
      { name: "description", content: "Turn a standard or topic into a ready-to-teach lesson plan." },
    ],
  }),
  component: GeneratorPage,
});

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-violet focus:ring-2 focus:ring-violet/30";

function GeneratorPage() {
  const [grade, setGrade] = useState<string>("3");
  const [subject, setSubject] = useState<string>(APP_CONFIG.subjects[0]);
  const [durationMin, setDurationMin] = useState<number>(45);
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");

  const [usage, setUsage] = useState<Usage | null>(null);
  const [plan, setPlan] = useState<LessonPlanData | null>(null);
  const [planMeta, setPlanMeta] = useState({ grade, subject, durationMin });
  const [savedId, setSavedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [regenUsed, setRegenUsed] = useState(0);
  const [busySection, setBusySection] = useState<SectionKey | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usageFn = useServerFn(getUsage);
  const generateFn = useServerFn(generateLessonPlan);
  const regenFn = useServerFn(regenerateSection);
  const saveFn = useServerFn(saveLessonPlan);

  useEffect(() => {
    usageFn().then(setUsage).catch(() => setUsage(null));
  }, [usageFn]);

  useBlocker({
    shouldBlockFn: () => dirty && !window.confirm("You have an unsaved lesson. Leave without saving?"),
    enableBeforeUnload: () => dirty,
  });

  const atCap = usage?.monthlyLimit != null && usage.lessonsUsed >= usage.monthlyLimit;
  const canGenerate = topic.trim().length > 0 && !generating && !atCap;

  async function handleGenerate() {
    if (!canGenerate) return;
    if (dirty && !window.confirm("Generating a new lesson will replace your unsaved one. Continue?")) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await generateFn({
        data: { grade, subject, durationMin, topic: topic.trim(), ...(title.trim() ? { title: title.trim() } : {}) },
      });
      setPlan(res.plan);
      setPlanMeta({ grade, subject, durationMin });
      setUsage(res.usage);
      setSavedId(null);
      setRegenUsed(0);
      setDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!plan) return;
    setSaving(true);
    try {
      const row = await saveFn({
        data: {
          ...(savedId ? { id: savedId } : {}),
          ...planMeta,
          plan: plan as unknown as Record<string, unknown>,
        },
      });
      setSavedId(row.id);
      setDirty(false);
      toast.success("Saved to My Lessons.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate(key: SectionKey) {
    if (!plan || !savedId) return;
    setBusySection(key);
    try {
      const res = await regenFn({
        data: { lessonId: savedId, section: key, lesson: plan as unknown as Record<string, unknown> },
      });
      const next: LessonPlanData = isTimed(key)
        ? { ...plan, [key]: { ...plan[key], content: res.content } }
        : { ...plan, [key]: res.content };
      next.editedSections = (plan.editedSections ?? []).filter((k) => k !== key);
      setPlan(next);
      setRegenUsed(res.regenerationCount);
      setDirty(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regeneration failed. Please try again.");
    } finally {
      setBusySection(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[360px_1fr] md:px-6">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">New lesson</h2>
              {usage && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {usage.monthlyLimit === null
                    ? "Pro · unlimited"
                    : `${usage.lessonsUsed} / ${usage.monthlyLimit} this month`}
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="grade" className="mb-1 block text-xs font-medium text-muted-foreground">Grade</label>
                  <select id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClass}>
                    {APP_CONFIG.grades.map((g) => (
                      <option key={g} value={g}>{gradeLabel(g)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="length" className="mb-1 block text-xs font-medium text-muted-foreground">Lesson length</label>
                  <select id="length" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className={inputClass}>
                    {APP_CONFIG.lessonLengths.map((m) => (
                      <option key={m} value={m}>{m} minutes</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="mb-1 block text-xs font-medium text-muted-foreground">Subject</label>
                <select id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass}>
                  {APP_CONFIG.subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="topic" className="mb-1 block text-xs font-medium text-muted-foreground">Standard or topic</label>
                <input
                  id="topic"
                  value={topic}
                  maxLength={APP_CONFIG.input.topicMaxChars}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder='e.g. "3.OA.A.1" or "multiplying by 7s"'
                  className={inputClass}
                />
                <p className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>Please don't include student names.</span>
                  <span>{topic.length}/{APP_CONFIG.input.topicMaxChars}</span>
                </p>
              </div>
              <div>
                <label htmlFor="title" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Title <span className="font-normal">(optional — we'll write one)</span>
                </label>
                <input
                  id="title"
                  value={title}
                  maxLength={APP_CONFIG.input.titleMaxChars}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-muted-foreground">Please don't include student names.</p>
              </div>
            </div>

            {atCap ? (
              <Link
                to="/app"
                onClick={(e) => e.preventDefault()}
                className="mt-4 block rounded-lg bg-muted px-4 py-3 text-center text-sm text-muted-foreground"
              >
                You've used all {usage?.monthlyLimit} free lessons this month. They reset on the 1st. Pro (coming soon) lifts the limit.
              </Link>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet px-4 py-2.5 text-sm font-semibold text-violet-foreground transition hover:bg-violet/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {generating ? "Writing your lesson…" : "Generate lesson"}
              </button>
            )}
          </div>
        </aside>

        <main className="min-w-0">
          {error && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="flex-1">{error}</span>
              <button onClick={handleGenerate} disabled={!canGenerate} className="rounded-md border border-border bg-card px-3 py-1.5 font-medium hover:bg-accent disabled:opacity-50">
                Try again
              </button>
            </div>
          )}
          {generating ? (
            <div className="space-y-4 rounded-2xl border border-border bg-card p-8">
              <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : plan ? (
            <LessonCanvas
              plan={plan}
              meta={planMeta}
              onChange={(p) => {
                setPlan(p);
                setDirty(true);
              }}
              actions={
                <button
                  onClick={handleSave}
                  disabled={saving || (!dirty && !!savedId)}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-violet-foreground transition hover:bg-violet/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savedId ? (dirty ? "Save changes" : "Saved") : "Save lesson"}
                </button>
              }
              regen={{
                used: regenUsed,
                limit: usage?.regensPerLesson ?? APP_CONFIG.limits.free.regensPerLesson,
                enabled: !!savedId,
                busy: busySection,
                onRegenerate: handleRegenerate,
              }}
            />
          ) : (
            <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <Wand2 className="h-8 w-8 text-violet" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">Your lesson will appear here</h3>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                Pick a grade, subject, and length, type a standard or topic, then hit Generate.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
