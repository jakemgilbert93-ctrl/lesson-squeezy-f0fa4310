import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText, Loader2, Trash2, Plus } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { listLessonPlans, deleteLessonPlan } from "@/lib/lesson-plan.functions";

type PlanRow = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  duration_min: number;
  updated_at: string;
};

export const Route = createFileRoute("/_authenticated/plans/")({
  head: () => ({
    meta: [
      { title: "My Lessons — Lesson Squeezy" },
      { name: "description", content: "Your saved lessons." },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const [plans, setPlans] = useState<PlanRow[] | null>(null);
  const listFn = useServerFn(listLessonPlans);
  const deleteFn = useServerFn(deleteLessonPlan);

  useEffect(() => {
    listFn()
      .then((rows) => setPlans(rows as PlanRow[]))
      .catch((e) => toast.error(e.message));
  }, [listFn]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this lesson? This can't be undone.")) return;
    try {
      await deleteFn({ data: { id } });
      setPlans((prev) => prev?.filter((p) => p.id !== id) ?? null);
      toast.success("Lesson deleted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.");
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Lessons</h1>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New lesson
          </Link>
        </div>

        {plans === null ? (
          <p className="mt-10 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading your lessons…
          </p>
        ) : plans.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-icon"><FileText className="h-8 w-8 text-foreground" aria-hidden="true" /></div>
            <h2 className="mt-3 text-lg font-semibold text-foreground">No saved lessons yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a lesson and save it to see it here.
            </p>
            <Link
              to="/app"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Create a lesson
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
              >
                <Link
                  to="/plans/$id"
                  params={{ id: p.id }}
                  className="block"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-primary">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.subject} · Grade {p.grade} · {p.duration_min} min
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Updated {new Date(p.updated_at).toLocaleDateString()}
                  </p>
                </Link>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
