import { describe, expect, it } from 'vitest';
import { formatLocalDateTime, formatUtcDateTime } from '../../src/domain/date-time';

describe('display date and time', () => {
  it('formats UTC timestamps without seconds or an ISO separator', () => {
    expect(formatUtcDateTime(Date.UTC(2026, 8, 11, 12, 0, 59))).toBe('2026-09-11 12:00');
  });

  it('formats local timestamps with the same fixed shape', () => {
    expect(formatLocalDateTime(new Date(2026, 0, 2, 3, 4, 59).getTime())).toBe('2026-01-02 03:04');
  });
});
