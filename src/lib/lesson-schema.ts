import { z } from "zod";
import { APP_CONFIG, gradeLabel } from "@/config/app-config";

export const TimedSection = z.object({
  minutes: z.number().int().min(1),
  content: z.string().min(1),
});

export const LessonSections = z.object({
  title: z.string().min(1).max(APP_CONFIG.input.titleMaxChars),
  objective: z.string().min(1),
  materials: z.string().min(1),
  warmUp: TimedSection,
  directInstruction: TimedSection,
  practice: TimedSection,
  exitTicket: z.string().min(1),
  differentiation: z.string().min(1),
});

export const SECTION_KEYS = [
  "objective",
  "materials",
  "warmUp",
  "directInstruction",
  "practice",
  "exitTicket",
  "differentiation",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export const TIMED_KEYS = ["warmUp", "directInstruction", "practice"] as const;
export type TimedKey = (typeof TIMED_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  objective: "Objective",
  materials: "Materials",
  warmUp: "Warm-up",
  directInstruction: "Direct Instruction",
  practice: "Guided & Independent Practice",
  exitTicket: "Exit-Ticket Check",
  differentiation: "Differentiation Note",
};

export function isTimed(key: SectionKey): key is TimedKey {
  return (TIMED_KEYS as readonly string[]).includes(key);
}

export type LessonPlanData = z.infer<typeof LessonSections> & {
  topic?: string | undefined;
  editedSections?: SectionKey[] | undefined;
};

export type LessonMeta = { grade: string; subject: string; durationMin: number };

export const VERIFY_NOTE = "Verify standard alignment before teaching.";

export function sectionText(plan: LessonPlanData, key: SectionKey): string {
  const v = plan[key];
  return typeof v === "string" ? v : v.content;
}

/** Converts older saved plans into the 7-section shape. */
export function normalizeLesson(raw: unknown): LessonPlanData {
  const parsed = LessonSections.safeParse(raw);
  if (parsed.success) {
    const r = raw as Record<string, unknown>;
    return {
      ...parsed.data,
      topic: typeof r["topic"] === "string" ? r["topic"] : undefined,
      editedSections: Array.isArray(r["editedSections"])
        ? (r["editedSections"] as SectionKey[])
        : [],
    };
  }
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : Array.isArray(v) ? v.join("\n") : "");
  const acts = Array.isArray(r["activities"])
    ? (r["activities"] as { name?: string; duration?: string; description?: string }[])
    : [];
  const mins = (s?: string) => Number.parseInt(s ?? "", 10) || 10;
  const first = acts[0];
  const rest = acts.slice(1);
  return {
    title: str(r["title"]) || "Untitled lesson",
    objective: str(r["objectives"]) || "—",
    materials: str(r["materials"]) || "—",
    warmUp: { minutes: 5, content: str(r["hook"]) || "—" },
    directInstruction: {
      minutes: mins(first?.duration),
      content: first ? `${first.name ?? ""}: ${first.description ?? ""}` : "—",
    },
    practice: {
      minutes: rest.reduce((s, a) => s + mins(a.duration), 0) || 10,
      content: rest.map((a) => `${a.name ?? ""}: ${a.description ?? ""}`).join("\n\n") || "—",
    },
    exitTicket: str(r["assessment"]) || "—",
    differentiation: str(r["differentiation"]) || "—",
    editedSections: [],
  };
}

export function metaLine(meta: LessonMeta) {
  return `${gradeLabel(meta.grade)} · ${meta.subject} · ${meta.durationMin} minutes`;
}

export function lessonToPlainText(plan: LessonPlanData, meta: LessonMeta): string {
  const parts = [plan.title, metaLine(meta), ""];
  for (const key of SECTION_KEYS) {
    const label = isTimed(key) ? `${SECTION_LABELS[key]} (${plan[key].minutes} min)` : SECTION_LABELS[key];
    parts.push(label.toUpperCase(), sectionText(plan, key), "");
  }
  parts.push(VERIFY_NOTE);
  return parts.join("\n");
}

export function lessonFilename(title: string) {
  const base = title.trim().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "-") || "lesson";
  return `${base}.docx`;
}
