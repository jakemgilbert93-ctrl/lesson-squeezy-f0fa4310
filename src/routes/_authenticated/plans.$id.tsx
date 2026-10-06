import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Printer, Save } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { LessonPlanView } from "@/components/LessonPlanView";
import {
  getLessonPlan,
  saveLessonPlan,
  type LessonPlanData,
  type StandardRef,
} from "@/lib/lesson-plan.functions";

export const Route = createFileRoute("/_authenticated/plans/$id")({
  head: () => ({
    meta: [
      { title: "Lesson plan — LessonForge" },
      { name: "description", content: "View and edit your saved lesson plan." },
    ],
  }),
  component: PlanDetailPage,
});

function PlanDetailPage() {
  const { id } = Route.useParams();
  const [plan, setPlan] = useState<LessonPlanData | null>(null);
  const [meta, setMeta] = useState<{
    subject: string;
    grade: string;
    durationMin: number;
    standards: StandardRef[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const getFn = useServerFn(getLessonPlan);
  const saveFn = useServerFn(saveLessonPlan);

  useEffect(() => {
    getFn({ data: { id } })
      .then((row) => {
        setPlan(row.plan as unknown as LessonPlanData);
        setMeta({
          subject: row.subject ?? "",
          grade: row.grade ?? "",
          durationMin: row.duration_min ?? 45,
          standards: (row.standards as unknown as StandardRef[]) ?? [],
        });
      })
      .catch((e) => toast.error(e.message));
  }, [id, getFn]);

  async function handleSave() {
    if (!plan || !meta) return;
    setSaving(true);
    try {
      await saveFn({
        data: {
          id,
          title: plan.title,
          subject: meta.subject,
          grade: meta.grade,
          durationMin: meta.durationMin,
          standards: meta.standards,
          plan: plan as unknown as Record<string, unknown>,
        },
      });
      toast.success("Changes saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/plans"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to my plans
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !plan}
              className="inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-mint-foreground transition hover:bg-mint/90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
            <button
              onClick={() => handlePrint()}
              disabled={!plan}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-60"
            >
              <Printer className="h-4 w-4" /> Export / PDF
            </button>
          </div>
        </div>

        <div className="mt-5">
          {plan ? (
            <>
              <p className="mb-3 text-xs text-muted-foreground">Click any text in the plan to edit it.</p>
              <LessonPlanView
                ref={printRef}
                plan={plan}
                meta={meta ?? undefined}
                onChange={setPlan}
              />
            </>
          ) : (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading plan…
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
