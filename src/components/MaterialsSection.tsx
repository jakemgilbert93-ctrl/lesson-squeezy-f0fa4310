import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronDown, Copy, FileDown, Info, Loader2, Lock, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { limitsFor } from "@/config/app-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OPEN_RESPONSE_NOTE, splitAnswerLabel, stripChoiceMarker, stripStepMarker } from "@/lib/material-labels";
import { generateMaterialItem, regenerateMaterialItem } from "@/lib/materials.functions";
import {
  ExitTicketContent, GameContent, QuizContent, VocabCardsContent, WorksheetContent, type MaterialItemType,
} from "@/lib/materials-schema";
import {
  downloadMaterialDocx, GAME_FORMAT_LABEL, materialDownloads, materialToText, type MaterialCopy,
} from "@/lib/materials-docx";

type Item = { id: string; item_type: string; title: string; content: unknown; regeneration_count: number };
type UsageRow = { plan: string; materials_used: number; materials_limit: number };

const ROWS: { type: MaterialItemType; label: string; blurb: string }[] = [
  { type: "exit_ticket", label: "Exit Ticket", blurb: "A quick end-of-class check on today's objective." },
  { type: "quiz", label: "Quiz", blurb: "Five multiple-choice questions with an answer key." },
  { type: "worksheet", label: "Worksheet", blurb: "Practice questions with an answer key." },
  { type: "vocab_cards", label: "Vocabulary Cards", blurb: "Cut-out cards with terms, definitions and examples." },
  { type: "game", label: "Game", blurb: "A ready-to-run classroom game with prompt cards." },
];
const NEEDS_CHECK: MaterialItemType[] = ["quiz", "worksheet", "game"];
/** Compact control sizing shared by Generate / Confirm / Cancel so every row's right edge lines up. */
const COMPACT = "h-8 gap-1.5 px-3 text-[13px] [&_svg]:size-3.5";

type Props = { lessonId: string; lessonTitle: string; grade: string | null; withStandardsFooter: boolean };

/** Five material types for a saved lesson. Only one AI request runs at a time. */
export function MaterialsSection({ lessonId, lessonTitle, grade, withStandardsFooter }: Props) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [usage, setUsage] = useState<UsageRow | null>(null);
  const [busy, setBusy] = useState<MaterialItemType | null>(null);
  const [open, setOpen] = useState<MaterialItemType | null>(null);
  const [confirming, setConfirming] = useState<MaterialItemType | null>(null);
  const [errors, setErrors] = useState<Partial<Record<MaterialItemType, string>>>({});
  const genFn = useServerFn(generateMaterialItem);
  const regenFn = useServerFn(regenerateMaterialItem);

  async function loadUsage() {
    const { data } = await supabase.rpc("get_my_usage");
    if (data?.[0]) setUsage(data[0] as UsageRow);
  }
  useEffect(() => {
    void supabase.from("lesson_materials_items").select("id, item_type, title, content, regeneration_count")
      .eq("lesson_id", lessonId).then(({ data }) => setItems((data as Item[]) ?? []));
    void loadUsage();
  }, [lessonId]);

  const isPro = usage?.plan === "pro";
  const regenLimit = limitsFor(isPro ? "pro" : "free").regensPerMaterial;
  const left = usage ? Math.max(0, usage.materials_limit - usage.materials_used) : 0;
  const monthlyFull = usage ? left === 0 : false;

  async function run(type: MaterialItemType, existing?: Item) {
    if (busy) return;
    setBusy(type);
    setConfirming(null);
    setErrors((e) => ({ ...e, [type]: undefined }));
    try {
      const res = existing
        ? await regenFn({ data: { itemId: existing.id } })
        : await genFn({ data: { lessonId, itemType: type } });
      const next = res.item as unknown as Item;
      setItems((list) => [...(list ?? []).filter((i) => i.item_type !== type), next]);
      setOpen(type);
      if (!existing) void loadUsage();
    } catch (e) {
      setErrors((x) => ({ ...x, [type]: e instanceof Error ? e.message : "Something went wrong. Please try again." }));
    } finally {
      setBusy(null);
    }
  }

  function onGenerate(type: MaterialItemType) {
    if (usage && !isPro && left === 1) setConfirming(type);
    else void run(type);
  }

  return (
    <section aria-labelledby="materials-heading" className="space-y-3">
      <div>
        <h2 id="materials-heading" className="text-2xl font-extrabold text-foreground">Materials</h2>
        {usage && (isPro ? (
          <p className="mt-1 text-sm text-muted-foreground">Materials this month: {usage.materials_used} of {usage.materials_limit}</p>
        ) : (
          <div className={cn("mt-2 w-full rounded-[12px] border px-3.5 py-3", monthlyFull ? "border-material-status-used-border bg-material-status-used" : "border-material-status-available-border bg-material-status-available")}>
            <p className="flex items-start gap-2 text-sm font-semibold text-notice-foreground">
              {monthlyFull ? <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> : <Sparkles aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{monthlyFull ? "Free sample used. Resets on the 1st." : "Free plan: 1 sample left this month. Pick any one of the five."}</span>
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">Pro includes 60 a month. <span className="rounded-full bg-material-status-pill px-2 py-0.5 text-notice-foreground">Coming soon</span></p>
          </div>
        ))}
      </div>
      {items === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading materials…</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {ROWS.map((row) => {
            const item = items.find((i) => i.item_type === row.type);
            const expanded = open === row.type && !!item;
            return (
              <li key={row.type}>
                <div className={cn("relative px-4 py-3.5", item && "cursor-pointer")}>
                  {item && (
                    <Button variant="ghost" type="button" aria-label={`Toggle ${row.label}`} aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? null : row.type)}
                      className="absolute inset-0 z-10 h-full w-full rounded-none p-0 hover:bg-transparent focus-visible:ring-inset" />
                  )}
                  <div className="flex min-h-8 items-center justify-between gap-3">
                    <span className="min-w-0 text-sm font-semibold text-foreground">{row.label}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {busy === row.type ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Working" />
                      ) : item ? (
                        <>
                          <Badge variant="secondary" className="h-8 px-3">Ready</Badge>
                          <ChevronDown aria-hidden="true" className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", expanded && "rotate-180")} />
                        </>
                      ) : !monthlyFull && confirming !== row.type ? (
                        <Button size="sm" className={cn(COMPACT, "shrink-0")} disabled={busy !== null || confirming !== null} onClick={(event) => { event.stopPropagation(); onGenerate(row.type); }}>
                          <Sparkles /> Generate
                        </Button>
                      ) : null}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{row.blurb}</p>
                  {!item && usage && !isPro && monthlyFull && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Lock aria-hidden="true" className="h-3 w-3 shrink-0" />Free sample used. Resets on the 1st.</p>
                  )}
                </div>
                {confirming === row.type && (
                  <div className="mx-4 mb-3 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
                    <p>This uses your free sample for the month. Generate {row.label}?</p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" className={COMPACT} onClick={() => run(row.type)}>Confirm</Button>
                      <Button size="sm" variant="outline" className={COMPACT} onClick={() => setConfirming(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
                {busy === row.type && (
                  <p role="status" aria-live="polite" className="px-4 pb-3 text-sm text-muted-foreground">
                    {item ? "Regenerating" : "Generating"} your {row.label.toLowerCase()}…
                  </p>
                )}
                {errors[row.type] && busy !== row.type && (
                  <p role="alert" className="px-4 pb-3 text-sm text-destructive">{errors[row.type]}</p>
                )}
                {expanded && item && busy !== row.type && (
                  <ItemPanel row={row} item={item} locked={busy !== null} regenLimit={regenLimit}
                    docBase={{ lessonTitle, grade, withStandardsFooter }} onRegenerate={() => run(row.type, item)} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


function ItemPanel({ row, item, locked, regenLimit, docBase, onRegenerate }: {
  row: (typeof ROWS)[number]; item: Item; locked: boolean; regenLimit: number;
  docBase: Omit<Props, "lessonId">; onRegenerate: () => void;
}) {
  const hasTeacher = row.type !== "vocab_cards";
  const [teacher, setTeacher] = useState(false);
  const [exporting, setExporting] = useState<MaterialCopy | null>(null);
  const left = Math.max(0, regenLimit - item.regeneration_count);
  const view: MaterialCopy = teacher && hasTeacher ? "key" : "student";

  async function copy() {
    try {
      await navigator.clipboard.writeText(materialToText({ itemType: row.type, itemTitle: item.title, content: item.content }, view));
      toast.success(`${view === "key" ? "Teacher" : "Student"} view copied to clipboard.`);
    } catch {
      toast.error("Couldn't copy. Please try again.");
    }
  }
  async function download(kind: MaterialCopy) {
    setExporting(kind);
    try {
      await downloadMaterialDocx({ ...docBase, itemType: row.type, itemTitle: item.title, content: item.content }, kind);
    } catch {
      toast.error("Couldn't create the Word file. Please try again.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="border-t border-border bg-background/50 px-4 py-4">
      {hasTeacher && (
        <div role="group" aria-label="View" className="inline-flex rounded-lg border border-border p-0.5 text-xs font-semibold">
          {(["Student view", "Teacher view"] as const).map((label, i) => {
            const active = teacher === (i === 1);
            return (
              <button key={label} type="button" aria-pressed={active} onClick={() => setTeacher(i === 1)}
                className={cn("rounded-md px-3 py-1 transition", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {label}
              </button>
            );
          })}
        </div>
      )}
      <MaterialBody type={row.type} title={item.title} content={item.content} teacher={view === "key"} />
      {NEEDS_CHECK.includes(row.type) && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" /> Check the answer key before using it with students.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={locked || left === 0} onClick={onRegenerate}>
          <RefreshCw /> Regenerate
        </Button>
        <Button variant="outline" size="sm" onClick={copy}><Copy /> Copy</Button>
        {materialDownloads(row.type).map((d) => (
          <Button key={d.copy} variant="outline" size="sm" disabled={exporting !== null} onClick={() => download(d.copy)}>
            {exporting === d.copy ? <Loader2 className="animate-spin" /> : <FileDown />} {d.label}
          </Button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{left} of {regenLimit} left</span>
        {left === 0 && <span className="rounded-full bg-limit-notice px-2 py-1 text-notice-foreground">Limit reached for this material</span>}
      </div>
    </div>
  );
}

const letter = (i: number) => String.fromCharCode(65 + i);
const broken = (label: string) => <p className="mt-3 text-sm text-destructive">This {label} couldn't be displayed. Try regenerating it.</p>;
const Lines = ({ n }: { n: number }) => (
  <div aria-hidden="true" className="mt-2 space-y-4">{Array.from({ length: n }).map((_, k) => <div key={k} className="border-b border-border" />)}</div>
);
const Choices = ({ choices }: { choices: string[] }) => (
  <ul className="mt-1 space-y-0.5">{choices.map((ch, j) => <li key={j} className="whitespace-pre-line">{letter(j)}. {stripChoiceMarker(ch)}</li>)}</ul>
);
const Answer = ({ answer, solution }: { answer: string; solution: string }) => {
  const { label, text } = splitAnswerLabel(answer);
  return (
    <div className="mt-1 rounded-md bg-muted/60 px-2 py-1.5">
      <p className="whitespace-pre-line font-semibold">
        {label}: {text}
        {label === "Sample answer" && <span className="font-normal text-muted-foreground"> {OPEN_RESPONSE_NOTE}</span>}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{solution}</p>
    </div>
  );
};

function MaterialBody({ type, title, content, teacher }: { type: MaterialItemType; title: string; content: unknown; teacher: boolean }) {
  const wrap = "mt-3 space-y-3 text-sm text-foreground [&_p]:whitespace-pre-line";
  if (type === "quiz") {
    const parsed = QuizContent.safeParse(content);
    if (!parsed.success) return broken("quiz");
    const c = parsed.data;
    return (
      <div className={wrap}>
        <p className="font-bold">{title}</p>
        {!teacher && <p className="text-muted-foreground">{c.directions}</p>}
        <ol className="list-decimal space-y-3 pl-5">
          {c.questions.map((q, i) => (
            <li key={i}>
              <p>{q.prompt}</p>
              {teacher ? <Answer answer={`${letter(q.correctIndex)}. ${stripChoiceMarker(q.choices[q.correctIndex])}`} solution={q.workedSolution} /> : <Choices choices={q.choices} />}
            </li>
          ))}
        </ol>
      </div>
    );
  }
  if (type === "worksheet") {
    const parsed = WorksheetContent.safeParse(content);
    if (!parsed.success) return broken("worksheet");
    const c = parsed.data;
    return (
      <div className={wrap}>
        <p className="font-bold">{title}</p>
        <p className="text-muted-foreground">{c.directions}</p>
        <ol className="list-decimal space-y-3 pl-5">
          {c.questions.map((q, i) => (
            <li key={i}>
              <p>{q.prompt}</p>
              {q.choices?.length ? <Choices choices={q.choices} /> : !teacher && <Lines n={q.answerLines ?? 3} />}
              {teacher && <Answer answer={q.answer} solution={q.workedSolution} />}
            </li>
          ))}
        </ol>
      </div>
    );
  }
  if (type === "vocab_cards") {
    const parsed = VocabCardsContent.safeParse(content);
    if (!parsed.success) return broken("set of cards");
    return (
      <div className={wrap}>
        <p className="font-bold">{title}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {parsed.data.cards.map((v, i) => (
            <div key={i} className="rounded-lg border border-dashed border-border bg-card p-3">
              <p className="font-bold text-primary">{v.term}</p>
              <p className="mt-1">{v.studentFriendlyDefinition}</p>
              <p className="mt-1 italic text-muted-foreground">{v.exampleSentence}</p>
              {v.memoryHint && <p className="mt-1 text-xs text-muted-foreground">Hint: {v.memoryHint}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (type === "game") {
    const parsed = GameContent.safeParse(content);
    if (!parsed.success) return broken("game");
    const c = parsed.data;
    return (
      <div className={wrap}>
        <p className="font-bold">{c.gameName}</p>
        <p><span className="font-semibold">Format:</span> {GAME_FORMAT_LABEL[c.format]}</p>
        <div><p className="font-semibold">Materials</p><ul className="list-disc pl-5">{c.materialsNeeded.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
        <div><p className="font-semibold">Setup</p><p className="whitespace-pre-wrap">{c.setup}</p></div>
        <div><p className="font-semibold">How to play</p><ol className="list-decimal pl-5">{c.howToPlay.map((s, i) => <li key={i}>{stripStepMarker(s)}</li>)}</ol></div>
        {teacher && (
          <div className="rounded-md bg-muted/60 px-2 py-1.5">
            <p className="font-semibold">Teacher notes</p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{c.teacherNotes}</p>
          </div>
        )}
        <p className="font-semibold">Cards</p>
        <ol className="space-y-2">
          {c.cards.map((card, i) => (
            <li key={i} className="rounded-lg border border-dashed border-border bg-card p-3">
              <p><span className="font-semibold">Card {i + 1}:</span> {card.prompt}</p>
              {card.choices?.length ? <Choices choices={card.choices} /> : null}
              {teacher && <Answer answer={card.answer} solution={card.workedSolution} />}
            </li>
          ))}
        </ol>
      </div>
    );
  }
  const parsed = ExitTicketContent.safeParse(content);
  if (!parsed.success) return broken("exit ticket");
  const c = parsed.data;
  return (
    <div className={wrap}>
      <p className="font-bold">{title}</p>
      {teacher ? (
        <div className="rounded-md bg-muted/60 px-2 py-1.5">
          <p className="font-semibold">Teacher notes</p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{c.teacherNotes || "—"}</p>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground">{c.directions}</p>
          <ol className="list-decimal space-y-3 pl-5">
            {c.questions.map((q, i) => (
              <li key={i}>
                <p>{q.prompt}</p>
                {q.choices?.length ? <Choices choices={q.choices} /> : <Lines n={q.answerLines ?? 3} />}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
