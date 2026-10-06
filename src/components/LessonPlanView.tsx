import { forwardRef } from "react";
import type { LessonPlanData } from "@/lib/lesson-plan.functions";

type Props = {
  plan: LessonPlanData;
  meta?: { subject?: string; grade?: string; durationMin?: number };
  onChange?: (plan: LessonPlanData) => void;
};

const sectionAccents = [
  { label: "Objectives", bar: "bg-coral", chip: "bg-coral/10 text-coral" },
  { label: "Materials", bar: "bg-amber", chip: "bg-amber/20 text-amber-foreground" },
  { label: "Hook", bar: "bg-mint", chip: "bg-mint/10 text-mint" },
  { label: "Activities", bar: "bg-sky", chip: "bg-sky/10 text-sky" },
  { label: "Assessment", bar: "bg-violet", chip: "bg-violet/10 text-violet" },
  { label: "Differentiation", bar: "bg-coral", chip: "bg-coral/10 text-coral" },
  { label: "Closure", bar: "bg-mint", chip: "bg-mint/10 text-mint" },
];

function EditableText({
  value,
  onChange,
  multiline = true,
  className = "",
}: {
  value: string;
  onChange?: ((v: string) => void) | undefined;
  multiline?: boolean | undefined;
  className?: string | undefined;
}) {
  if (!onChange) {
    return <p className={`whitespace-pre-wrap text-sm leading-relaxed text-foreground ${className}`}>{value}</p>;
  }
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.max(2, value.split("\n").length)}
        className={`w-full resize-y rounded-md border border-transparent bg-transparent px-2 py-1 text-sm leading-relaxed text-foreground outline-none transition hover:border-border focus:border-violet focus:bg-card focus:ring-2 focus:ring-violet/20 ${className}`}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-foreground outline-none transition hover:border-border focus:border-violet focus:bg-card focus:ring-2 focus:ring-violet/20 ${className}`}
    />
  );
}

function SectionHeader({ index }: { index: number }) {
  const accent = sectionAccents[index % sectionAccents.length];
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className={`h-5 w-1.5 rounded-full ${accent.bar}`} />
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${accent.chip}`}>
        {accent.label}
      </span>
    </div>
  );
}

/**
 * Renders a lesson plan as structured sections. When `onChange` is provided,
 * every field is editable in place. Forward a ref to make it printable.
 */
export const LessonPlanView = forwardRef<HTMLDivElement, Props>(function LessonPlanView(
  { plan, meta, onChange },
  ref,
) {
  const update = (patch: Partial<LessonPlanData>) => onChange?.({ ...plan, ...patch });

  return (
    <div ref={ref} className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      {/* Title + meta */}
      <EditableText
        value={plan.title}
        multiline={false}
        onChange={onChange ? (v) => update({ title: v }) : undefined}
        className="text-2xl font-bold"
      />
      {meta && (meta.subject || meta.grade) && (
        <p className="mt-1 text-sm text-muted-foreground">
          {[meta.subject, meta.grade ? `Grade ${meta.grade}` : "", meta.durationMin ? `${meta.durationMin} min` : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      {/* Objectives */}
      <section className="mt-7">
        <SectionHeader index={0} />
        <ul className="space-y-2">
          {plan.objectives.map((obj, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
              <EditableText
                value={obj}
                onChange={
                  onChange
                    ? (v) => {
                        const objectives = [...plan.objectives];
                        objectives[i] = v;
                        update({ objectives });
                      }
                    : undefined
                }
                className="flex-1"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Materials */}
      <section className="mt-7">
        <SectionHeader index={1} />
        <ul className="space-y-2">
          {plan.materials.map((m, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
              <EditableText
                value={m}
                onChange={
                  onChange
                    ? (v) => {
                        const materials = [...plan.materials];
                        materials[i] = v;
                        update({ materials });
                      }
                    : undefined
                }
                className="flex-1"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Hook */}
      <section className="mt-7">
        <SectionHeader index={2} />
        <EditableText value={plan.hook} onChange={onChange ? (v) => update({ hook: v }) : undefined} />
      </section>

      {/* Activities */}
      <section className="mt-7">
        <SectionHeader index={3} />
        <div className="space-y-4">
          {plan.activities.map((a, i) => (
            <div key={i} className="rounded-xl border border-border bg-background/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <EditableText
                  value={a.name}
                  multiline={false}
                  onChange={
                    onChange
                      ? (v) => {
                          const activities = [...plan.activities];
                          activities[i] = { ...a, name: v };
                          update({ activities });
                        }
                      : undefined
                  }
                  className="flex-1 font-semibold"
                />
                <EditableText
                  value={a.duration}
                  multiline={false}
                  onChange={
                    onChange
                      ? (v) => {
                          const activities = [...plan.activities];
                          activities[i] = { ...a, duration: v };
                          update({ activities });
                        }
                      : undefined
                  }
                  className="w-24 text-right text-xs text-muted-foreground"
                />
              </div>
              <EditableText
                value={a.description}
                onChange={
                  onChange
                    ? (v) => {
                        const activities = [...plan.activities];
                        activities[i] = { ...a, description: v };
                        update({ activities });
                      }
                    : undefined
                }
                className="mt-1.5"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Assessment */}
      <section className="mt-7">
        <SectionHeader index={4} />
        <EditableText
          value={plan.assessment}
          onChange={onChange ? (v) => update({ assessment: v }) : undefined}
        />
      </section>

      {/* Differentiation */}
      <section className="mt-7">
        <SectionHeader index={5} />
        <EditableText
          value={plan.differentiation}
          onChange={onChange ? (v) => update({ differentiation: v }) : undefined}
        />
      </section>

      {/* Closure */}
      <section className="mt-7">
        <SectionHeader index={6} />
        <EditableText value={plan.closure} onChange={onChange ? (v) => update({ closure: v }) : undefined} />
      </section>
    </div>
  );
});
