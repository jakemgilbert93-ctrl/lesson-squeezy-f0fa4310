/**
 * Teacher's Pet — single source of truth for limits and option lists.
 * Change values here; no other code needs to change.
 */
export const APP_CONFIG = {
  appName: "Teacher's Pet",

  /** AI model used for lesson generation and section regeneration. */
  aiModel: "google/gemini-3.7-flash",

  limits: {
    free: {
      monthlyLessons: 5 as number | null, // null = unlimited
      regensPerLesson: 5,
    },
    pro: {
      monthlyLessons: null as number | null,
      regensPerLesson: 15,
    },
    /** Max AI calls (generations + regenerations) per user per window. */
    aiCallsPerWindow: 10,
    aiWindowSeconds: 60,
  },

  input: {
    topicMaxChars: 200,
    titleMaxChars: 100,
  },

  grades: ["TK", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  subjects: [
    "Math",
    "English Language Arts",
    "Science",
    "Social Studies",
    "Art",
    "Music",
    "Physical Education",
    "Health",
    "World Languages",
    "Computer Science",
  ],
  lessonLengths: [30, 45, 60, 90],
} as const;

export type PlanTier = "free" | "pro";

export function limitsFor(tier: PlanTier) {
  return APP_CONFIG.limits[tier];
}

export function gradeLabel(grade: string) {
  if (grade === "TK") return "Transitional Kindergarten";
  if (grade === "K") return "Kindergarten";
  return `Grade ${grade}`;
}
