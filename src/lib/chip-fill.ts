/** Decorative chip fills in a fixed cycle. Never encodes subject, grade or status. */
const CHIP_FILLS = ["bg-blush", "bg-babyblue", "bg-skyblue"] as const;
export function chipFill(index: number): string {
  return `${CHIP_FILLS[((index % 3) + 3) % 3]} text-foreground`;
}
