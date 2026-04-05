/**
 * Returns the local date as YYYY-MM-DD string.
 * Uses getFullYear/getMonth/getDate which respect the user's timezone,
 * unlike toISOString() which always returns UTC.
 */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
