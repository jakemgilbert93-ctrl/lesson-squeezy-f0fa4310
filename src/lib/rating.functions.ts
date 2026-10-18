import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RateInput = z.object({
  lessonId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  grade: z.string().max(20),
  subject: z.string().max(100),
});

/** Saves (or updates) the signed-in teacher's 1–5 star rating for one of their lessons. */
export const rateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RateInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Only allow rating lessons the teacher owns.
    const { data: lesson } = await supabase
      .from("lesson_plans")
      .select("id")
      .eq("id", data.lessonId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!lesson) throw new Error("Lesson not found. Save the lesson first.");
    const { error } = await supabase.from("lesson_ratings").upsert(
      {
        lesson_id: data.lessonId,
        user_id: userId,
        rating: data.rating,
        grade: data.grade,
        subject: data.subject,
      },
      { onConflict: "lesson_id,user_id" },
    );
    if (error) throw new Error("Could not save your rating. Please try again.");
    return { ok: true };
  });

/** Returns the teacher's existing rating for a lesson, if any. */
export const getLessonRating = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lessonId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("lesson_ratings")
      .select("rating")
      .eq("lesson_id", data.lessonId)
      .eq("user_id", userId)
      .maybeSingle();
    return { rating: (row?.rating as number | undefined) ?? null };
  });
