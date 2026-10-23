import { monthlyCountExplanation } from "@/lib/monthly-lesson-count";

export function MonthlyCountExplanation({ used, lessons }: { used: number; lessons: readonly { created_at: string }[] | undefined }) {
  if (!lessons) return null;
  const text = monthlyCountExplanation(used, lessons);
  return text ? <p className="mt-2 text-sm text-muted-foreground">{text}</p> : null;
}