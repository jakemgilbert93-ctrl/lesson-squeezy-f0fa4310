import { SECTION_KEYS, isTimed, sectionText, type LessonPlanData, type SectionKey } from "./lesson-schema";

export function changedSections(plan: LessonPlanData, baseline: LessonPlanData): SectionKey[] {
  return SECTION_KEYS.filter((key) => sectionText(plan, key) !== sectionText(baseline, key));
}

export function lessonHasChanges(plan: LessonPlanData, baseline: LessonPlanData): boolean {
  return plan.title !== baseline.title || changedSections(plan, baseline).length > 0;
}

export function restoreSection(plan: LessonPlanData, baseline: LessonPlanData, key: SectionKey): LessonPlanData {
  const editedSections = (plan.editedSections ?? []).filter((section) => section !== key);
  if (baseline.editedSections?.includes(key)) editedSections.push(key);
  return isTimed(key)
    ? { ...plan, [key]: { ...plan[key], content: sectionText(baseline, key) }, editedSections }
    : { ...plan, [key]: sectionText(baseline, key), editedSections };
}