const HOUR_MS = 60 * 60 * 1000;

export function getInitialLocalDeadline(now = new Date()): Date {
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() + 1);
  candidate.setHours(0, 0, 0, 0);
  if (candidate.getTime() - now.getTime() < HOUR_MS) candidate.setDate(candidate.getDate() + 1);
  return candidate;
}

export function toDateTimeLocal(date: Date): string {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}
