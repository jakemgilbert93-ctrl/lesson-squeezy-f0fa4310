import { SuccessNote } from "@/components/SuccessNote";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { changedSections, restoreSection } from "@/lib/lesson-edits";
import { chipFill } from "@/lib/chip-fill";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, FileDown, Loader2, RefreshCw, Clock, Info, Pencil } from "lucide-react";
import {
  SECTION_KEYS,
  SECTION_LABELS,
  VERIFY_NOTE,
  isTimed,
  lessonToPlainText,
  metaLine,
  sectionText,
  type LessonMeta,
  type LessonPlanData,
  type SectionKey,
  visibleStandard,
  enteredStandard,
} from "@/lib/lesson-schema";
import { downloadLessonDocx } from "@/lib/lesson-docx";
import { StandardCard } from "./StandardCard";

type Props = {
  plan: LessonPlanData;
  baseline: LessonPlanData;
  saving: boolean;
  onSave: () => Promise<void>;
  meta: LessonMeta;
  onChange: (plan: LessonPlanData) => void;
  /** Extra buttons (e.g. Save) shown in the toolbar. */
  actions?: ReactNode;
  /** True once the lesson exists in My Lessons; Copy is shown only then. */
  saved: boolean;
  /** Show the "Saved to My Lessons" confirmation (right after a save). */
  showSavedNotice?: boolean;
  regen: {
    used: number;
    limit: number;
    /** False when the lesson isn't saved yet. */
    enabled: boolean;
    busy: SectionKey | null;
    onRegenerate: (key: SectionKey) => void;
  };
  /** Shown instead of the plain "save to regenerate" note while unsaved. */
  saveHint?: string | undefined;
};

const fieldClass =
  "w-full resize-y rounded-md border border-transparent bg-transparent px-2 py-1 text-sm leading-relaxed text-foreground outline-none transition hover:border-border focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20";

/** Shared 7-section lesson editor used by the generator and the saved-lesson page. */
export function LessonCanvas({ plan, baseline, saving, onSave, meta, onChange, actions, saved, showSavedNotice, regen, saveHint }: Props) {
  const [exporting, setExporting] = useState(false);
  const [editingMaterials, setEditingMaterials] = useState(false);
  const previousBaseline = useRef(baseline);
  const [savedSections, setSavedSections] = useState<SectionKey[]>([]);
  const unsaved = new Set(changedSections(plan, baseline));
  useEffect(() => {
    if (previousBaseline.current !== baseline) {
      setSavedSections(showSavedNotice ? changedSections(baseline, previousBaseline.current) : []);
      previousBaseline.current = baseline;
    }
  }, [baseline, showSavedNotice]);
  const edited = new Set(plan.editedSections ?? []);
  const std = visibleStandard(plan);
  const entered = enteredStandard(plan);
  const left = Math.max(0, regen.limit - regen.used);

  function markEdited(key: SectionKey, next: LessonPlanData) {
    const set = new Set(next.editedSections ?? []);
    set.add(key);
    onChange({ ...next, editedSections: Array.from(set) });
  }

  function setText(key: SectionKey, value: string) {
    setSavedSections((sections) => sections.filter((section) => section !== key));
    if (isTimed(key)) markEdited(key, { ...plan, [key]: { ...plan[key], content: value } });
    else markEdited(key, { ...plan, [key]: value });
  }

  function requestRegen(key: SectionKey) {
    if (edited.has(key) && !window.confirm("This will replace your edits to this section.")) return;
    regen.onRegenerate(key);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(lessonToPlainText(plan, meta));
      toast.success("Lesson copied to clipboard.");
    } catch {
      toast.error("Couldn't copy. Please try again.");
    }
  }

  async function exportDocx() {
    setExporting(true);
    try {
      await downloadLessonDocx(plan, meta);
    } catch {
      toast.error("Couldn't create the Word file. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 items-center gap-2 max-sm:[&>button]:min-w-0 max-sm:[&>button]:justify-center max-sm:[&>button]:px-2 sm:flex sm:flex-wrap">
        {actions}
        <button
          onClick={exportDocx}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-60"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Download .docx
        </button>
        {saved && (
          <button
            onClick={copy}
            className="col-span-2 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            <Copy className="h-4 w-4" /> Copy
          </button>
        )}
        <span className="col-span-2 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-muted-foreground sm:justify-start sm:text-left">
          <span>{regen.enabled
            ? `${left} of ${regen.limit} section regenerations left`
            : (saveHint ?? "Save the lesson to regenerate sections")}</span>
          {regen.enabled && left === 0 && <span className="rounded-full bg-limit-notice px-2 py-1 text-notice-foreground">Limit reached for this lesson</span>}
        </span>
      </div>
      {showSavedNotice && (
        <SuccessNote>
          Saved to My Lessons.
          <Link to="/plans" className="font-semibold underline-offset-2 hover:underline">
            Go to My Lessons
          </Link>
        </SuccessNote>
      )}

      <article className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
        <textarea
          value={plan.title}
          disabled={saving}
          maxLength={100}
          rows={1}
          onChange={(e) => onChange({ ...plan, title: e.target.value })}
          aria-label="Lesson title"
          className={`${fieldClass} [field-sizing:content] min-h-0 resize-none overflow-hidden break-words text-3xl font-extrabold leading-tight md:text-4xl`}
        />
        <p className="mt-1 px-2 text-sm text-muted-foreground">{metaLine(meta)}</p>

        <div className="mt-6 space-y-6">
          {std && <StandardCard standard={std} />}
          {entered && (
            <section aria-label="Standard (entered by you)" className="rounded-xl border border-border bg-muted/40 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Standard (entered by you)</h3>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{entered}</p>
            </section>
          )}
          {SECTION_KEYS.map((key) => {
            const text = sectionText(plan, key);
            const busy = regen.busy === key;
            return (
              <section key={key}>
                <div className="mb-2 flex flex-wrap items-center gap-2 px-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{SECTION_LABELS[key]}</h3>
                  {isTimed(key) && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${key === "practice" ? "bg-lavender text-foreground" : chipFill(SECTION_KEYS.filter(isTimed).indexOf(key))}`}>
                      <Clock className="h-3 w-3" /> {plan[key].minutes} min
                    </span>
                  )}
                  <button
                    onClick={() => requestRegen(key)}
                    disabled={saving || !regen.enabled || left === 0 || regen.busy !== null}
                    title={!regen.enabled ? "Save the lesson first" : left === 0 ? "No regenerations left" : "Regenerate this section"}
                    className="ml-auto inline-flex min-h-10 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:px-2 sm:py-1"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
                    {busy ? "Regenerating…" : "Regenerate"}
                  </button>
                </div>
                {busy ? (
                  <div className="space-y-2 px-2">
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  </div>
                ) : key === "materials" && !editingMaterials ? (
                  <div className="px-2">
                    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground">
                      {materialItems(text).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setEditingMaterials(true)}
                      disabled={saving}
                      className="mt-2 inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground outline outline-1 outline-border transition hover:bg-accent hover:text-foreground sm:px-2 sm:py-1 sm:outline-none"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit materials
                    </button>
                  </div>
                ) : (
                  <textarea
                    onBlur={key === "materials" ? () => setEditingMaterials(false) : undefined}
                    autoFocus={key === "materials"}
                    value={text}
                    disabled={saving}
                    onChange={(e) => setText(key, e.target.value)}
                    rows={Math.max(2, text.split("\n").length + 1)}
                    aria-label={SECTION_LABELS[key]}
                    className={`${fieldClass} [field-sizing:content] min-h-16`}
                  />
                )}
                {unsaved.has(key) ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 px-2">
                    <span className="text-sm text-notice-foreground/70">Unsaved changes</span>
                    <div className="flex items-center gap-2">
                      <Button className="min-h-10 max-sm:px-3" disabled={saving || regen.busy !== null} onClick={() => void onSave()}>
                        {saving && <Loader2 className="animate-spin" />}Save changes
                      </Button>
                      <Button variant="outline" className="min-h-10 max-sm:px-3" disabled={saving || regen.busy !== null} onClick={() => {
                        setSavedSections((sections) => sections.filter((section) => section !== key));
                        onChange(restoreSection(plan, baseline, key));
                      }}>Discard edit</Button>
                    </div>
                  </div>

                ) : savedSections.includes(key) && (
                  <SuccessNote className="mt-2 mx-2 w-fit">Saved</SuccessNote>
                )}
              </section>
            );
          })}
        </div>

        <p className="mt-8 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" /> {VERIFY_NOTE}
        </p>
      </article>
    </div>
  );
}

/** Split the materials text into one item per line, dropping bullet markers and blanks. */
function materialItems(text: string): string[] {
  const items = text
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
  return items.length ? items : ["—"];
}
