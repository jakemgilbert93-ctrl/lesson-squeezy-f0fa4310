import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { standardsSubjectFor } from "@/config/app-config";

export type StandardOption = {
  ccssId: string;
  code: string;
  domainName: string | null;
  cluster: string | null;
  standardText: string;
};

/** Standards for the picker. Signed-in only; empty when standards are off or not applicable. */
export const listStandards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ grade: z.string(), subject: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const dbSubject = standardsSubjectFor(data.grade, data.subject);
    if (!dbSubject) return [] as StandardOption[];
    const { data: rows, error } = await context.supabase
      .from("standards")
      .select("ccss_id, code, domain_name, cluster_or_category, standard_text, sort_order")
      .eq("grade", data.grade)
      .eq("subject", dbSubject)
      .order("sort_order");
    if (error) throw new Error("Could not load standards.");
    return (rows ?? []).map((r) => ({
      ccssId: r.ccss_id,
      code: r.code,
      domainName: r.domain_name,
      cluster: r.cluster_or_category,
      standardText: r.standard_text,
    })) as StandardOption[];
  });
