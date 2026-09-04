function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function joinDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}`;
}

/**
 * Formats a timestamp as a UTC date and time.
 * @param timestamp - Timestamp in milliseconds since the Unix epoch.
 * @returns A human-readable UTC label.
 */
export function formatUtcDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return joinDateTime(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  );
}

/**
 * Formats a timestamp in the runtime's local time zone.
 * @param timestamp - Timestamp in milliseconds since the Unix epoch.
 * @returns A human-readable local date and time.
 */
export function formatLocalDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return joinDateTime(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  );
}
