import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---- Schemas ----

export const StandardRef = z.object({
  code: z.string(),
  text: z.string(),
});
export type StandardRef = z.infer<typeof StandardRef>;

export const LessonPlanInput = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().min(1),
  grade: z.string().min(1),
  durationMin: z.number().int().min(5).max(240),
  standards: z.array(StandardRef).min(1),
  focus: z.string().max(2000).optional().default(""),
  classSize: z.number().int().min(1).max(60).optional().default(25),
});
export type LessonPlanInput = z.infer<typeof LessonPlanInput>;

const LessonPlanData = z.object({
  title: z.string(),
  objectives: z.array(z.string()),
  materials: z.array(z.string()),
  hook: z.string(),
  activities: z.array(
    z.object({
      name: z.string(),
      duration: z.string(),
      description: z.string(),
    }),
  ),
  assessment: z.string(),
  differentiation: z.string(),
  closure: z.string(),
});
export type LessonPlanData = z.infer<typeof LessonPlanData>;

// ---- AI generation ----

export const generateLessonPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => LessonPlanInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) {
      throw new Error("AI is not configured yet. Please contact the app owner.");
    }

    const gateway = createLovableAiGatewayProvider(key);
    const standardsText = data.standards
      .map((s) => `- ${s.code}: ${s.text}`)
      .join("\n");

    const systemPrompt = `You are an expert instructional designer and veteran K-12 teacher. Create an engaging, creative, and rigorous lesson plan fully aligned to the provided academic standards. The plan must be practical, classroom-ready, age-appropriate, and pedagogically sound. Include a hook to engage students, a clear sequence of activities with realistic timing, an assessment that checks for understanding of the standards, differentiation strategies for diverse learners, and a strong closure.`;

    const prompt = `Create a lesson plan with these parameters:
- Title: ${data.title}
- Subject: ${data.subject}
- Grade level: ${data.grade}
- Duration: ${data.durationMin} minutes
- Class size: ${data.classSize} students
- Teacher focus/notes: ${data.focus || "None provided"}

The lesson plan MUST address these standards:
${standardsText}

Make objectives measurable and tied directly to the standards. Keep activity descriptions concrete and actionable with specific examples. Ensure the total activity durations fit within ${data.durationMin} minutes.`;

    const jsonInstruction = `

Respond with ONLY a single valid JSON object (no markdown fences, no commentary) matching this exact shape:
{
  "title": string,
  "objectives": string[],
  "materials": string[],
  "hook": string,
  "activities": [{ "name": string, "duration": string, "description": string }],
  "assessment": string,
  "differentiation": string,
  "closure": string
}`;

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { text } = await generateText({
          model: gateway("google/gemini-3.7-flash"),
          system: systemPrompt,
          prompt: prompt + jsonInstruction,
        });
        const cleaned = text
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start === -1 || end === -1) throw new Error("No JSON in response");
        const parsed = JSON.parse(cleaned.slice(start, end + 1));
        return LessonPlanData.parse(parsed);
      } catch (err) {
        lastError = err;
      }
    }
    console.error("Lesson plan generation failed:", lastError);
    throw new Error(
      "The AI couldn't produce a valid plan just now. Please try again.",
    );
  });

// ---- CRUD on lesson_plans ----

const PLAN_COLUMNS =
  "id, title, subject, grade, duration_min, standards, plan, created_at, updated_at";

const SavePlanInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  subject: z.string(),
  grade: z.string(),
  durationMin: z.number().int(),
  standards: z.array(StandardRef),
  plan: z.record(z.string(), z.unknown()),
});

export const saveLessonPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SavePlanInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      title: data.title,
      subject: data.subject,
      grade: data.grade,
      duration_min: data.durationMin,
      standards: data.standards as unknown as Json,
      plan: data.plan as Json,
    };

    if (data.id) {
      const { data: row, error } = await supabase
        .from("lesson_plans")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", userId)
        .select(PLAN_COLUMNS)
        .single();
      if (error) throw new Error(error.message);
      return row;
    }

    const { data: row, error } = await supabase
      .from("lesson_plans")
      .insert(payload)
      .select(PLAN_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listLessonPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("lesson_plans")
      .select(PLAN_COLUMNS)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const getLessonPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("lesson_plans")
      .select(PLAN_COLUMNS)
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteLessonPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("lesson_plans")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
