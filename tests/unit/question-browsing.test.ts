import { describe, expect, it } from 'vitest';
import {
  formatAnswerCount,
  getDeadlinePresentation,
  getViewerPresentation,
} from '../../src/domain/question-browsing';

describe('Question browsing presentation', () => {
  it.each([
    [0, '0 answers'],
    [1, '1 answer'],
    [2, '2 answers'],
  ])('formats %i answers with the correct plurality', (count, expected) => {
    expect(formatAnswerCount(count)).toBe(expected);
  });

  it('never returns a negative remaining duration', () => {
    expect(getDeadlinePresentation(100, 101)).toEqual({
      absolute: '1970-01-01T00:00:00.100Z',
      absoluteLabel: '1970-01-01 00:00',
      remainingLabel: 'Closed',
      remainingMs: 0,
    });
  });

  it.each([
    [100 + 2 * 24 * 60 * 60 * 1000, '2 days'],
    [100 + 3 * 60 * 60 * 1000, '3 hours'],
    [100 + 15 * 60 * 1000, '15 minutes'],
    [101, 'Less than 1 minute'],
  ])('uses a meaningful remaining-time unit for %i', (deadline, expected) => {
    expect(getDeadlinePresentation(deadline, 100).remainingLabel).toBe(expected);
  });

  it.each([
    ['OPEN', false, 'not-submitted', 'anonymous'],
    ['OPEN', true, 'not-submitted', 'authenticated-unsubmitted'],
    ['OPEN', true, 'submitted', 'authenticated-submitted'],
    ['OPEN', true, 'unavailable', 'submission-unavailable'],
    ['OPEN', false, 'unavailable', 'submission-unavailable'],
    ['CLOSED', true, 'submitted', 'closed'],
    ['REVEALED', true, 'submitted', 'closed'],
    ['REVEALED', false, 'not-submitted', 'anonymous'],
  ] as const)(
    'derives an exclusive viewer presentation for %s/%s/%s',
    (state, authenticated, submission, expected) => {
      expect(getViewerPresentation({ authenticated, state, submission })).toBe(expected);
    },
  );
});
