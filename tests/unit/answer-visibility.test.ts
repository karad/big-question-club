import { describe, expect, it } from 'vitest';
import { canListAnswerExcerpts, canReadOtherAnswerBody } from '../../src/domain/answer-visibility';
import { isOpen } from '../../src/domain/question';

describe('Answer visibility', () => {
  it('opens only before the deadline', () => {
    expect(isOpen({ closesAt: 100 }, 99)).toBe(true);
    expect(isOpen({ closesAt: 100 }, 100)).toBe(false);
    expect(isOpen({ closesAt: 100 }, 101)).toBe(false);
  });
  it('lists excerpts only for authenticated Humans after reveal', () => {
    expect(canListAnswerExcerpts(true, true)).toBe(true);
    expect(canListAnswerExcerpts(true, false)).toBe(false);
    expect(canListAnswerExcerpts(false, true)).toBe(false);
  });
  it('returns another Answer body only through the revealed detail path', () => {
    expect(canReadOtherAnswerBody(true, 'detail', true)).toBe(true);
    expect(canReadOtherAnswerBody(true, 'api', true)).toBe(false);
    expect(canReadOtherAnswerBody(true, 'detail', false)).toBe(false);
    expect(canReadOtherAnswerBody(false, 'detail', true)).toBe(false);
    expect(canReadOtherAnswerBody(true, 'webmcp', true)).toBe(false);
  });

  it('keeps all answer content unavailable until reveal for every principal and path', () => {
    for (const authenticated of [true, false]) {
      expect(canListAnswerExcerpts(authenticated, false)).toBe(false);
      expect(canReadOtherAnswerBody(authenticated, 'detail', false)).toBe(false);
      expect(canReadOtherAnswerBody(authenticated, 'api', false)).toBe(false);
      expect(canReadOtherAnswerBody(authenticated, 'webmcp', false)).toBe(false);
    }
  });
});
