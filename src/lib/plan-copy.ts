import { APP_CONFIG, limitsFor, type PlanTier } from "@/config/app-config";

/** Price text for a plan, built from app-config. */
export function priceLabel(tier: PlanTier): string {
  const p = APP_CONFIG.plans[tier].monthlyPriceUsd;
  if (p === null) return "Price to be announced";
  if (p === 0) return "$0";
  return `$${p}/month`;
}

export function lessonsLine(tier: PlanTier): string {
  const n = limitsFor(tier).monthlyLessons;
  return n === null ? "No monthly lesson limit" : `${n} lessons per month`;
}

export function regensLine(tier: PlanTier): string {
  return `${limitsFor(tier).regensPerLesson} section regenerations per lesson`;
}
