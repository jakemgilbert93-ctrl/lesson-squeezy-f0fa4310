import { z } from "zod";
import { APP_CONFIG, gradeLabel, standardsActive } from "@/config/app-config";

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

/** Snapshot of the official standard, attached by the server (never AI-written). */
export const StandardSnapshot = z.object({
  ccssId: z.string(),
  code: z.string(),
  standardText: z.string(),
  notes: z.string().nullable(),
  sourceUrl: z.string().nullable(),
});
export type StandardSnapshot = z.infer<typeof StandardSnapshot>;

export type LessonPlanData = z.infer<typeof LessonSections> & {
  topic?: string | undefined;
  editedSections?: SectionKey[] | undefined;
  standard?: StandardSnapshot | undefined;
  teacherStandard?: string | undefined;
};

export type LessonMeta = { grade: string; subject: string; durationMin: number };

export const VERIFY_NOTE = "Verify standard alignment before teaching.";

/** The standard to display, or null when standards are off / none attached. */
export function visibleStandard(plan: LessonPlanData): StandardSnapshot | null {
  return plan.standard && standardsActive() ? plan.standard : null;
}

/** Teacher text is kept verbatim, separate from database-verified snapshots. */
export function enteredStandard(plan: LessonPlanData): string | null {
  return !visibleStandard(plan) && plan.teacherStandard?.trim() ? plan.teacherStandard : null;
}

export function sectionText(plan: LessonPlanData, key: SectionKey): string {
  const v = plan[key];
  return typeof v === "string" ? v : v.content;
}

/** Converts older saved plans into the 7-section shape. */
export function normalizeLesson(raw: unknown): LessonPlanData {
  const parsed = LessonSections.safeParse(raw);
  if (parsed.success) {
    const r = raw as Record<string, unknown>;
    const std = StandardSnapshot.safeParse(r["standard"]);
    return {
      ...parsed.data,
      topic: typeof r["topic"] === "string" ? r["topic"] : undefined,
      editedSections: Array.isArray(r["editedSections"])
        ? (r["editedSections"] as SectionKey[])
        : [],
      ...(std.success ? { standard: std.data } : {}),
      ...(typeof r["teacherStandard"] === "string" && r["teacherStandard"].trim()
        ? { teacherStandard: r["teacherStandard"] } : {}),
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
  const std = visibleStandard(plan);
  if (std) {
    parts.push("STANDARD", `${std.code} — Verified standard · Common Core State Standards`, std.standardText);
    if (std.notes) parts.push(std.notes);
    const online = standardOnlineUrl(std);
    if (online) parts.push(`${STANDARD_ONLINE_LABEL}: ${online}`);
    const src = standardsSourceUrl(std);
    if (src) parts.push(`${STANDARDS_SOURCE_LABEL}: ${src}`);
    if (online || src) parts.push(STANDARD_LINK_NOTE);
    parts.push(APP_CONFIG.standards.copyrightNotice, "");
  }
  const entered = enteredStandard(plan);
  if (entered) parts.push("Standard (entered by you)", entered, "");
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

/** Link text shown with a verified standard. */
export const STANDARDS_SOURCE_LABEL = "Official PDF";
export const STANDARD_ONLINE_LABEL = "View this standard online";
export const STANDARD_LINK_NOTE =
  "Reference links may change or go out of date. Please confirm the standard in the official PDF or your state's standards.";

const STANDARDS_SOURCE_PDF = {
  Math: "https://corestandards.org/wp-content/uploads/2023/09/Math_Standards1.pdf",
  ELA: "https://corestandards.org/wp-content/uploads/2023/09/ELA_Standards1.pdf",
} as const;

/** Official source document for a verified standard: one PDF per subject. */
export function standardsSourceUrl(std: StandardSnapshot): string | null {
  if (std.ccssId.startsWith("CCSS.Math.Content.")) return STANDARDS_SOURCE_PDF.Math;
  if (std.ccssId.startsWith("CCSS.ELA-Literacy.")) return STANDARDS_SOURCE_PDF.ELA;
  return null;
}

/** Single place that builds the per-standard web link; return null to remove it. */
export function standardOnlineUrl(std: StandardSnapshot): string | null {
  const math = /^CCSS\.Math\.Content\.([K0-9]+)\.([A-Z]+)\.([A-Z])\.(\d+)$/.exec(std.ccssId);
  if (math) {
    const [, grade, domain, cluster, num] = math;
    return `https://thecorestandards.org/Math/Content/${grade}/${domain}/#CCSS.Math.Content.${grade}.${domain}.${cluster}.${num}`;
  }
  const ela = /^CCSS\.ELA-Literacy\.([A-Z]+)\.([K0-9]+)\.(\d+)$/.exec(std.ccssId);
  if (ela) {
    const [, strand, grade, num] = ela;
    return `https://www.thecorestandards.org/ELA-Literacy/${strand}/${grade}/${num}/`;
  }
  return null;
}
