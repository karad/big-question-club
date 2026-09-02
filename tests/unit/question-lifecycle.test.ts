import { describe, expect, it } from 'vitest';
import { getQuestionState } from '../../src/domain/question-lifecycle';

describe('Question lifecycle', () => {
  it.each([
    ['draft before every boundary', null, 50, 100, 0, 'DRAFT'],
    ['draft at the close boundary', null, 50, 100, 50, 'DRAFT'],
    ['draft at the reveal boundary', null, 50, 100, 100, 'DRAFT'],
    ['draft after every boundary', null, 50, 100, 101, 'DRAFT'],
    ['open when published', 10, 50, 100, 10, 'OPEN'],
    ['open one millisecond after publication', 10, 50, 100, 11, 'OPEN'],
    ['open midway through submissions', 10, 50, 100, 30, 'OPEN'],
    ['open one millisecond before close', 10, 50, 100, 49, 'OPEN'],
    ['closed exactly at close', 10, 50, 100, 50, 'CLOSED'],
    ['closed one millisecond after close', 10, 50, 100, 51, 'CLOSED'],
    ['closed midway to reveal', 10, 50, 100, 75, 'CLOSED'],
    ['closed one millisecond before reveal', 10, 50, 100, 99, 'CLOSED'],
    ['revealed exactly at reveal', 10, 50, 100, 100, 'REVEALED'],
    ['revealed one millisecond after reveal', 10, 50, 100, 101, 'REVEALED'],
    ['revealed long after reveal', 10, 50, 100, 1_000, 'REVEALED'],
    ['open before a shared close and reveal', 10, 50, 50, 49, 'OPEN'],
    ['revealed at a shared close and reveal', 10, 50, 50, 50, 'REVEALED'],
    ['revealed after a shared close and reveal', 10, 50, 50, 51, 'REVEALED'],
    ['open with epoch publication', 0, 1, 2, 0, 'OPEN'],
    ['closed with epoch-adjacent boundaries', 0, 1, 2, 1, 'CLOSED'],
    ['revealed with epoch-adjacent boundaries', 0, 1, 2, 2, 'REVEALED'],
  ] as const)('returns only %s', (_label, publishedAt, closesAt, revealsAt, now, expectedState) => {
    expect(getQuestionState({ publishedAt, closesAt, revealsAt }, now)).toBe(expectedState);
  });

  it('returns the same boundary state across ten evaluations', () => {
    const states = Array.from({ length: 10 }, () =>
      getQuestionState({ publishedAt: 10, closesAt: 50, revealsAt: 50 }, 50),
    );
    expect(states).toEqual(Array.from({ length: 10 }, () => 'REVEALED'));
  });
});
