import { describe, expect, it } from 'vitest';
import { getInitialLocalDeadline, toDateTimeLocal } from '../../src/domain/question-deadline';

describe('question deadline default', () => {
  it('uses the next local midnight when it is at least one hour away', () => {
    const result = getInitialLocalDeadline(new Date(2026, 8, 3, 12));
    expect(result).toEqual(new Date(2026, 8, 4, 0));
  });

  it('skips to the following midnight when less than one hour remains', () => {
    const result = getInitialLocalDeadline(new Date(2026, 11, 31, 23, 30));
    expect(result).toEqual(new Date(2027, 0, 2, 0));
    expect(toDateTimeLocal(result)).toMatch(/^2027-01-02T00:00$/);
  });
});
