import { describe, expect, it } from 'vitest';
import {
  validateQuestionSchedule,
  validateQuestionTransition,
} from '../../src/domain/question-lifecycle';

describe('Question schedule', () => {
  it.each([
    ['draft with ordered boundaries', { publishedAt: null, closesAt: 20, revealsAt: 30 }, null],
    ['immediate reveal', { publishedAt: 10, closesAt: 20, revealsAt: 20 }, null],
    ['delayed reveal', { publishedAt: 10, closesAt: 20, revealsAt: 30 }, null],
    [
      'future publication',
      { publishedAt: 11, closesAt: 20, revealsAt: 30 },
      'PUBLICATION_IN_FUTURE',
    ],
    [
      'publication at close',
      { publishedAt: 20, closesAt: 20, revealsAt: 30 },
      'INVALID_TIME_ORDER',
    ],
    [
      'publication after close',
      { publishedAt: 21, closesAt: 20, revealsAt: 30 },
      'INVALID_TIME_ORDER',
    ],
    ['reveal before close', { publishedAt: 10, closesAt: 20, revealsAt: 19 }, 'INVALID_TIME_ORDER'],
  ] as const)('validates %s', (_label, schedule, expectedCode) => {
    expect(validateQuestionSchedule(schedule, 10)?.code ?? null).toBe(expectedCode);
  });

  it('allows a draft to be published without moving a boundary backward', () => {
    expect(
      validateQuestionTransition(
        { publishedAt: null, closesAt: 20, revealsAt: 30 },
        { publishedAt: 10, closesAt: 20, revealsAt: 30 },
        10,
      ),
    ).toBeNull();
  });

  it.each([
    [
      'removing publication',
      { publishedAt: 10, closesAt: 20, revealsAt: 30 },
      { publishedAt: null, closesAt: 20, revealsAt: 30 },
    ],
    [
      'reopening a closed question',
      { publishedAt: 10, closesAt: 20, revealsAt: 30 },
      { publishedAt: 10, closesAt: 40, revealsAt: 50 },
    ],
    [
      'reopening a revealed question',
      { publishedAt: 10, closesAt: 20, revealsAt: 20 },
      { publishedAt: 10, closesAt: 40, revealsAt: 40 },
    ],
  ] as const)('rejects %s', (_label, current, proposed) => {
    expect(validateQuestionTransition(current, proposed, 30)?.code).toBe('INVALID_TRANSITION');
  });
});
