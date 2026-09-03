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
