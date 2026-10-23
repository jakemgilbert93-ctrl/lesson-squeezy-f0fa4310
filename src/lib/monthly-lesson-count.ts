type CreatedLesson = { created_at: string };

export function savedThisUtcMonth(lessons: readonly CreatedLesson[], now = new Date()): number {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return lessons.filter(({ created_at }) => {
    const created = Date.parse(created_at);
    return created >= start && created < end;
  }).length;
}

export function monthlyCountExplanation(used: number, lessons: readonly CreatedLesson[], now = new Date()): string | null {
  const saved = savedThisUtcMonth(lessons, now);
  return used > saved
    ? `${saved} saved this month. Lessons you delete or never save still count toward your monthly limit.`
    : null;
}