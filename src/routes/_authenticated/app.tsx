import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { Loader2, Save, Printer, Wand2 } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { LessonPlanView } from "@/components/LessonPlanView";
import { getStandards, getStandardsFilters, type Standard } from "@/lib/standards.functions";
import {
  generateLessonPlan,
  saveLessonPlan,
  type LessonPlanData,
} from "@/lib/lesson-plan.functions";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Lesson generator — LessonForge" },
      { name: "description", content: "Generate a standards-aligned lesson plan with AI." },
    ],
  }),
  component: GeneratorPage,
});

const SUBJECT_SUGGESTIONS = ["ELA", "Math", "Science", "Social Studies", "Art", "Music", "PE"];

function GeneratorPage() {
  // Standards picker state
  const [filters, setFilters] = useState<{ states: string[]; subjects: string[]; grades: string[] }>({
    states: [],
    subjects: [],
    grades: [],
  });
  const [state, setState] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [standards, setStandards] = useState<Standard[]>([]);
  const [selected, setSelected] = useState<Map<string, Standard>>(new Map());
  const [loadingStandards, setLoadingStandards] = useState(false);

  // Lesson params
  const [title, setTitle] = useState("");
  const [durationMin, setDurationMin] = useState(45);
  const [classSize, setClassSize] = useState(25);
  const [focus, setFocus] = useState("");

  // Generated plan
  const [plan, setPlan] = useState<LessonPlanData | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const generateFn = useServerFn(generateLessonPlan);
  const saveFn = useServerFn(saveLessonPlan);

  useEffect(() => {
    getStandardsFilters()
      .then(setFilters)
      .catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    if (!state && !subject && !grade) {
      setStandards([]);
      return;
    }
    setLoadingStandards(true);
    getStandards({
      data: {
        ...(state ? { state } : {}),
        ...(subject ? { subject } : {}),
        ...(grade ? { grade } : {}),
      },
    })
      .then(setStandards)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingStandards(false));
  }, [state, subject, grade]);

  const canGenerate = useMemo(
    () => title.trim().length > 0 && subject.trim().length > 0 && grade.trim().length > 0 && selected.size > 0,
    [title, subject, grade, selected],
  );

  function toggleStandard(s: Standard) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(s.id)) next.delete(s.id);
      else next.set(s.id, s);
      return next;
    });
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const result = await generateFn({
        data: {
          title: title.trim(),
          subject,
          grade,
          durationMin,
          classSize,
          focus,
          standards: Array.from(selected.values()).map((s) => ({ code: s.code, text: s.text })),
        },
      });
      setPlan(result);
      setSavedId(null);
      toast.success("Lesson plan generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed. Please try again.");
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
          title: plan.title || title,
          subject,
          grade,
          durationMin,
          standards: Array.from(selected.values()).map((s) => ({ code: s.code, text: s.text })),
          plan: plan as unknown as Record<string, unknown>,
        },
      });
      setSavedId(row.id);
      toast.success("Saved to your library.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 md:grid-cols-[380px_1fr] md:px-6">
        {/* Left: inputs */}
        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">1 · Standards</h2>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {(
                [
                  ["State", state, setState, filters.states],
                  ["Subject", subject, setSubject, filters.subjects],
                  ["Grade", grade, setGrade, filters.grades],
                ] as const
              ).map(([label, value, setter, options]) => (
                <div key={label}>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
                  <select
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
                  >
                    <option value="">All</option>
                    {options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border bg-background/50 p-2">
              {loadingStandards ? (
                <p className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading standards…
                </p>
              ) : standards.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                  Pick a state, subject, or grade to browse standards.
                </p>
              ) : (
                standards.map((s) => (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer gap-2.5 rounded-lg border p-2.5 text-sm transition ${
                      selected.has(s.id)
                        ? "border-violet/50 bg-violet/10"
                        : "border-transparent hover:bg-accent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleStandard(s)}
                      className="mt-0.5 accent-violet"
                    />
                    <span>
                      <span className="font-semibold text-foreground">{s.code}</span>{" "}
                      <span className="text-muted-foreground">{s.text}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
            {selected.size > 0 && (
              <p className="mt-2 text-xs font-medium text-violet">
                {selected.size} standard{selected.size > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">2 · Lesson details</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Lesson title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Exploring Fractions with Pizza"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Math"
                  list="subject-suggestions"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
                />
                <datalist id="subject-suggestions">
                  {SUBJECT_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Grade</label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Duration (min)</label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={durationMin}
                    onChange={(e) => setDurationMin(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Class size</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={classSize}
                    onChange={(e) => setClassSize(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Focus / notes <span className="font-normal">(optional)</span>
                </label>
                <textarea
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  rows={3}
                  placeholder="e.g. My class struggles with word problems; keep it hands-on."
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-violet focus:ring-2 focus:ring-violet/30"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet px-4 py-2.5 text-sm font-semibold text-violet-foreground transition hover:bg-violet/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" /> Generate lesson plan
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Right: output */}
        <main className="min-w-0">
          {plan ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-mint-foreground transition hover:bg-mint/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savedId ? "Update saved plan" : "Save to library"}
                </button>
                <button
                  onClick={() => handlePrint()}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
                >
                  <Printer className="h-4 w-4" /> Export / PDF
                </button>
                <span className="text-xs text-muted-foreground">
                  Click any text in the plan to edit it.
                </span>
              </div>
              <LessonPlanView
                ref={printRef}
                plan={plan}
                meta={{ subject, grade, durationMin }}
                onChange={setPlan}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <div className="rainbow-gradient flex h-14 w-14 items-center justify-center rounded-2xl">
                <Wand2 className="h-7 w-7 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">Your lesson plan will appear here</h3>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                Select at least one standard, fill in the lesson details, and hit
                Generate. You'll get a full, editable, standards-aligned plan.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
