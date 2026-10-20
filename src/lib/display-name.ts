/** Blank names are absent; never infer a name from an email address. */
export function normalizeDisplayName(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

export function welcomeGreeting(value: string | null | undefined): string {
  const name = normalizeDisplayName(value);
  return name ? `Welcome back, ${name}` : "Welcome back";
}