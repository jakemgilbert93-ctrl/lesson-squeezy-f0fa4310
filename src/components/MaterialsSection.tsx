import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, FileDown, Loader2, RefreshCw, Sparkles, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { limitsFor } from "@/config/app-config";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { generateMaterialItem, regenerateMaterialItem } from "@/lib/materials.functions";
import { ExitTicketContent, QuizContent, type MaterialItemType } from "@/lib/materials-schema";
import { downloadMaterialDocx, materialToText, type MaterialCopy } from "@/lib/materials-docx";

type Item = { id: string; item_type: string; title: string; content: unknown; regeneration_count: number };
type UsageRow = { plan: string; materials_used: number; materials_limit: number };

const CARDS: { type: MaterialItemType; label: string; blurb: string }[] = [
  { type: "exit_ticket", label: "Exit Ticket", blurb: "A quick end-of-class check on today's objective, with teacher notes." },
  { type: "quiz", label: "Quiz", blurb: "Five multiple-choice questions with an answer key and worked solutions." },
];

type Props = { lessonId: string; lessonTitle: string; grade: string | null; withStandardsFooter: boolean };

/** Exit ticket and quiz for a saved lesson. Only one AI request runs at a time. */
export function MaterialsSection({ lessonId, lessonTitle, grade, withStandardsFooter }: Props) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [usage, setUsage] = useState<UsageRow | null>(null);
  const [busy, setBusy] = useState<MaterialItemType | null>(null);
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

  const regenLimit = limitsFor(usage?.plan === "pro" ? "pro" : "free").regensPerMaterial;
  const monthlyFull = usage ? usage.materials_used >= usage.materials_limit : false;

  async function run(type: MaterialItemType, existing?: Item) {
    if (busy) return;
    setBusy(type);
    setErrors((e) => ({ ...e, [type]: undefined }));
    try {
      const res = existing
        ? await regenFn({ data: { itemId: existing.id } })
        : await genFn({ data: { lessonId, itemType: type } });
      const next = res.item as unknown as Item;
      setItems((list) => [...(list ?? []).filter((i) => i.item_type !== type), next]);
      if (!existing) void loadUsage();
    } catch (e) {
      setErrors((x) => ({ ...x, [type]: e instanceof Error ? e.message : "Something went wrong. Please try again." }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="materials-heading" className="mt-10 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="materials-heading" className="text-2xl font-extrabold text-foreground">Materials</h2>
        {usage && (
          <p className="text-sm text-muted-foreground">Materials this month: {usage.materials_used} of {usage.materials_limit}</p>
        )}
      </div>
      {items === null ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading materials…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {CARDS.map((card) => {
            const item = items.find((i) => i.item_type === card.type);
            return (
              <MaterialCard key={card.type} card={card} item={item} busy={busy === card.type} locked={busy !== null}
                error={errors[card.type]} monthlyFull={monthlyFull} regenLimit={regenLimit}
                docBase={{ lessonTitle, grade, withStandardsFooter }}
                onGenerate={() => run(card.type)} onRegenerate={() => item && run(card.type, item)} />
            );
          })}
        </div>
      )}
    </section>
  );
}

function MaterialCard({ card, item, busy, locked, error, monthlyFull, regenLimit, docBase, onGenerate, onRegenerate }: {
  card: (typeof CARDS)[number]; item?: Item; busy: boolean; locked: boolean; error?: string; monthlyFull: boolean;
  regenLimit: number; docBase: Omit<Props, "lessonId">; onGenerate: () => void; onRegenerate: () => void;
}) {
  const [teacher, setTeacher] = useState(false);
  const [exporting, setExporting] = useState<MaterialCopy | null>(null);
  const left = item ? Math.max(0, regenLimit - item.regeneration_count) : 0;
  const switchId = `teacher-${card.type}`;

  async function copy() {
    if (!item) return;
    try {
      await navigator.clipboard.writeText(materialToText({ itemType: card.type, itemTitle: item.title, content: item.content }, teacher ? "key" : "student"));
      toast.success(`${teacher ? "Teacher" : "Student"} view copied to clipboard.`);
    } catch {
      toast.error("Couldn't copy. Please try again.");
    }
  }
  async function download(kind: MaterialCopy) {
    if (!item) return;
    setExporting(kind);
    try {
      await downloadMaterialDocx({ ...docBase, itemType: card.type, itemTitle: item.title, content: item.content }, kind);
    } catch {
      toast.error("Couldn't create the Word file. Please try again.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{card.label}</h3>
      {busy ? (
        <div className="mt-3 space-y-2" role="status" aria-live="polite">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {item ? "Regenerating" : "Generating"} your {card.label.toLowerCase()}…</p>
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ) : !item ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">{card.blurb}</p>
          {monthlyFull ? (
            <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">You've used all your materials for this month. They reset on the 1st.</p>
          ) : (
            <Button className="mt-4 w-fit" disabled={locked} onClick={onGenerate}><Sparkles /> Generate</Button>
          )}
        </>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-2">
            <Switch id={switchId} checked={teacher} onCheckedChange={setTeacher} />
            <Label htmlFor={switchId}>Teacher view</Label>
          </div>
          <MaterialBody type={card.type} title={item.title} content={item.content} teacher={teacher} />
          {card.type === "quiz" && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" /> Check the answer key before using it with students.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={locked || left === 0} onClick={onRegenerate} title={left === 0 ? "No regenerations left" : undefined}>
              <RefreshCw /> Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={copy}><Copy /> Copy</Button>
            <Button variant="outline" size="sm" disabled={exporting !== null} onClick={() => download("student")}>
              {exporting === "student" ? <Loader2 className="animate-spin" /> : <FileDown />} Student copy
            </Button>
            <Button variant="outline" size="sm" disabled={exporting !== null} onClick={() => download("key")}>
              {exporting === "key" ? <Loader2 className="animate-spin" /> : <FileDown />} Answer key
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {left === 0 ? `This ${card.label.toLowerCase()} has used all ${regenLimit} regenerations.` : `${left} of ${regenLimit} regenerations left`}
          </p>
        </>
      )}
      {error && !busy && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </article>
  );
}

function MaterialBody({ type, title, content, teacher }: { type: MaterialItemType; title: string; content: unknown; teacher: boolean }) {
  const letter = (i: number) => String.fromCharCode(65 + i);
  if (type === "quiz") {
    const parsed = QuizContent.safeParse(content);
    if (!parsed.success) return <p className="mt-3 text-sm text-destructive">This quiz couldn't be displayed. Try regenerating it.</p>;
    const c = parsed.data;
    return (
      <div className="mt-3 space-y-3 text-sm text-foreground">
        <p className="font-bold">{title}</p>
        {!teacher && <p className="text-muted-foreground">{c.directions}</p>}
        <ol className="list-decimal space-y-3 pl-5">
          {c.questions.map((q, i) => (
            <li key={i}>
              <p>{q.prompt}</p>
              {teacher ? (
                <div className="mt-1 rounded-md bg-muted/60 px-2 py-1.5">
                  <p className="font-semibold">Answer: {letter(q.correctIndex)}. {q.choices[q.correctIndex]}</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{q.workedSolution}</p>
                </div>
              ) : (
                <ul className="mt-1 space-y-0.5">{q.choices.map((ch, j) => <li key={j}>{letter(j)}. {ch}</li>)}</ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  }
  const parsed = ExitTicketContent.safeParse(content);
  if (!parsed.success) return <p className="mt-3 text-sm text-destructive">This exit ticket couldn't be displayed. Try regenerating it.</p>;
  const c = parsed.data;
  return (
    <div className="mt-3 space-y-3 text-sm text-foreground">
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
                {q.choices?.length ? (
                  <ul className="mt-1 space-y-0.5">{q.choices.map((ch, j) => <li key={j}>{letter(j)}. {ch}</li>)}</ul>
                ) : (
                  <div aria-hidden="true" className="mt-2 space-y-4">
                    {Array.from({ length: q.answerLines ?? 3 }).map((_, n) => <div key={n} className="border-b border-border" />)}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
