import { describe, expect, it } from 'vitest';
import { createAnonymousParticipantVisual } from '../../src/domain/anonymous-participant';

describe('createAnonymousParticipantVisual', () => {
  it('returns the same question-scoped visual for the same answer', () => {
    expect(createAnonymousParticipantVisual('question-1', 'answer-1')).toEqual(
      createAnonymousParticipantVisual('question-1', 'answer-1'),
    );
  });

  it('changes the visual when the same answer key is scoped to another question', () => {
    expect(createAnonymousParticipantVisual('question-1', 'answer-1')).not.toEqual(
      createAnonymousParticipantVisual('question-2', 'answer-1'),
    );
  });

  it('creates a bounded horizontally symmetric five-by-five pattern', () => {
    const visual = createAnonymousParticipantVisual('question-1', 'answer-1');
    const cells = new Set(visual.cells.map(([x, y]) => `${x}:${y}`));

    expect(visual.cells.length).toBeGreaterThan(0);
    for (const [x, y] of visual.cells) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(5);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(5);
      expect(cells.has(`${4 - x}:${y}`)).toBe(true);
    }
  });
});
