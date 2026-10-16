import { createFileRoute, Link, useBlocker } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Save, Wand2, AlertCircle, Check, Star, ChevronDown } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { LessonCanvas } from "@/components/LessonCanvas";
import { APP_CONFIG, gradeLabel, standardsSubjectFor } from "@/config/app-config";
import { listStandards, type StandardOption } from "@/lib/standards.functions";
import { StandardCard } from "@/components/StandardCard";
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
      { title: "New lesson — Lesson Squeezy" },
      { name: "description", content: "Turn a standard or topic into a ready-to-teach lesson plan." },
    ],
  }),
  component: GeneratorPage,
});

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

// Native select arrows sit against the border, so the picker draws its own
// chevron with the same inset as the text padding on the other side.
const selectClass = `${inputClass} cursor-pointer appearance-none pr-9`;

function Picker({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <span className="relative block">
        <select id={id} value={value} onChange={onChange} className={selectClass}>
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </span>
    </div>
  );
}

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
  const [justSaved, setJustSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [regenUsed, setRegenUsed] = useState(0);
  const [busySection, setBusySection] = useState<SectionKey | null>(null);
  const [generating, setGenerating] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stdOptions, setStdOptions] = useState<StandardOption[]>([]);
  const [ccssId, setCcssId] = useState("");
  const pickerOn = standardsSubjectFor(grade, subject) !== null;
  const listStdFn = useServerFn(listStandards);
  useEffect(() => {
    setCcssId("");
    setStdOptions([]);
    if (!pickerOn) return;
    let live = true;
    listStdFn({ data: { grade, subject } })
      .then((rows) => live && setStdOptions(rows))
      .catch(() => live && toast.error("Couldn't load standards."));
    return () => {
      live = false;
    };
  }, [grade, subject, pickerOn, listStdFn]);
  const selectedStd = pickerOn ? stdOptions.find((o) => o.ccssId === ccssId) : undefined;
  const stdGroups = useMemo(() => {
    const m = new Map<string, StandardOption[]>();
    for (const o of stdOptions) {
      const k = [o.domainName, o.cluster].filter(Boolean).join(" — ") || "Other";
      m.set(k, [...(m.get(k) ?? []), o]);
    }
    return Array.from(m.entries());
  }, [stdOptions]);

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
  const canGenerate = (topic.trim().length > 0 || !!selectedStd) && !generating && !atCap;

  async function handleGenerate() {
    if (!canGenerate) return;
    if (dirty && !window.confirm("Generating a new lesson will replace your unsaved one. Continue?")) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await generateFn({
        data: { grade, subject, durationMin, topic: topic.trim(), ...(selectedStd ? { ccssId: selectedStd.ccssId } : {}), ...(title.trim() ? { title: title.trim() } : {}) },
      });
      setPlan(res.plan);
      setPlanMeta({ grade, subject, durationMin });
      setUsage(res.usage);
      setSavedId(null);
      setJustSaved(false);
      setRegenUsed(0);
      setDirty(true);
      setReady(true);
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
      setJustSaved(true);
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
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[360px_1fr] md:px-6">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">New lesson</h2>
              {usage && (
                <span className="rounded-full bg-blush px-2.5 py-1 text-xs font-medium text-foreground">
                  {usage.monthlyLimit === null
                    ? "Pro · unlimited"
                    : `${usage.lessonsUsed} / ${usage.monthlyLimit} this month`}
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Picker id="grade" label="Grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
                  {APP_CONFIG.grades.map((g) => (
                    <option key={g} value={g}>{gradeLabel(g)}</option>
                  ))}
                </Picker>
                <Picker id="length" label="Lesson length" value={String(durationMin)} onChange={(e) => setDurationMin(Number(e.target.value))}>
                  {APP_CONFIG.lessonLengths.map((m) => (
                    <option key={m} value={m}>{m} minutes</option>
                  ))}
                </Picker>
              </div>
              <Picker id="subject" label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                {APP_CONFIG.subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Picker>
              {pickerOn && (
                <Picker
                  id="standard"
                  label={<>Standard <span className="font-normal">(optional)</span></>}
                  value={ccssId}
                  onChange={(e) => setCcssId(e.target.value)}
                >
                  <option value="">No standard</option>
                  {stdGroups.map(([group, opts]) => (
                    <optgroup key={group} label={group}>
                      {opts.map((o) => (
                        <option key={o.ccssId} value={o.ccssId}>
                          {o.code} — {o.standardText.length > 60 ? `${o.standardText.slice(0, 60)}…` : o.standardText}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Picker>
              )}
              <div>
                <label htmlFor="topic" className="mb-1 block text-xs font-medium text-muted-foreground">
                  {selectedStd ? "Additional focus (optional)" : "Standard or topic"}
                </label>
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
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
          {selectedStd && (generating || !plan) && (
            <div className="mb-4">
              <StandardCard standard={{ ccssId: selectedStd.ccssId, code: selectedStd.code, standardText: selectedStd.standardText, notes: selectedStd.notes, sourceUrl: selectedStd.sourceUrl }} />
            </div>
          )}
          {generating ? (
            <div className="space-y-4 rounded-xl border border-border bg-card p-8">
              <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : plan && ready ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-border bg-card p-10 text-center">
              <div className="animate-pop-in flex h-16 w-16 items-center justify-center rounded-full bg-success">
                <Check className="h-8 w-8 text-success-foreground" />
              </div>
              <div className="mt-4 flex gap-1.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <Star key={i} className="animate-star h-4 w-4 fill-cheer text-cheer" style={{ animationDelay: `${300 + i * 150}ms` }} />
                ))}
              </div>
              <h3 className="mt-3 text-lg font-bold text-foreground">Your lesson is ready</h3>
              <p className="mt-1 text-sm text-muted-foreground">Nice work — your class is going to love this one.</p>
              <button
                onClick={() => setReady(false)}
                className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                View lesson
              </button>
            </div>
          ) : plan ? (
            <LessonCanvas
              plan={plan}
              meta={planMeta}
              onChange={(p) => {
                setPlan(p);
                setDirty(true);
                setJustSaved(false);
              }}
              saved={!!savedId}
              showSavedNotice={justSaved}
              actions={
                <button
                  onClick={handleSave}
                  disabled={saving || (!dirty && !!savedId)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save lesson
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
            <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-icon">
                <Wand2 className="h-8 w-8 text-foreground" aria-hidden="true" />
              </div>
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
