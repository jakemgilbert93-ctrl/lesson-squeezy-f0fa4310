import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Standard = z.object({
  id: z.string(),
  state: z.string(),
  subject: z.string(),
  grade: z.string(),
  code: z.string(),
  text: z.string(),
  category: z.string().nullable().optional(),
});
export type Standard = z.infer<typeof Standard>;

function createPublicClient() {
  const url = process.env["SUPABASE_URL"] ?? import.meta.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Public read of the standards catalog (table has a public SELECT policy). */
export const getStandards = createServerFn({ method: "GET" })
  .inputValidator((data: { state?: string; subject?: string; grade?: string }) => data)
  .handler(async ({ data }) => {
    const client = createPublicClient();
    if (!client) throw new Error("Standards catalog is unavailable.");

    let query = client
      .from("standards")
      .select("id, state, subject, grade, code, text, category")
      .order("state")
      .order("subject")
      .order("grade")
      .order("code");

    if (data.state) query = query.eq("state", data.state);
    if (data.subject) query = query.eq("subject", data.subject);
    if (data.grade) query = query.eq("grade", data.grade);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as Standard[];
  });

/** Distinct filter values for the standards picker. */
export const getStandardsFilters = createServerFn({ method: "GET" }).handler(async () => {
  const client = createPublicClient();
  if (!client) return { states: [], subjects: [], grades: [] };

  const { data: rows, error } = await client
    .from("standards")
    .select("state, subject, grade");
  if (error) throw new Error(error.message);

  const uniq = (col: "state" | "subject" | "grade") =>
    Array.from(new Set((rows ?? []).map((r) => r[col]).filter(Boolean))).sort();

  return { states: uniq("state"), subjects: uniq("subject"), grades: uniq("grade") };
});
