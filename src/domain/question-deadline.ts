const HOUR_MS = 60 * 60 * 1000;

/**
 * Chooses the initial local deadline offered by the question form.
 * @param now - Current local date and time.
 * @returns The next 18:00 that is at least one hour in the future.
 */
export function getInitialLocalDeadline(now = new Date()): Date {
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() + 1);
  candidate.setHours(0, 0, 0, 0);
  if (candidate.getTime() - now.getTime() < HOUR_MS) candidate.setDate(candidate.getDate() + 1);
  return candidate;
}

/**
 * Formats a date for a `datetime-local` form control.
 * @param date - Local date and time to format.
 * @returns A local date-time string without a time-zone suffix.
 */
export function toDateTimeLocal(date: Date): string {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}
