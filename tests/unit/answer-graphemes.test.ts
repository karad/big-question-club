import { describe, expect, it } from 'vitest';
import { parseSubmissionInput } from '../../src/domain/answer-submission';

describe('Answer grapheme limits', () => {
  it('accepts complex emoji according to visible-character count', () => {
    const family = '👨‍👩‍👧‍👦';
    expect(
      parseSubmissionInput({ answer: family.repeat(5000), excerpt: family.repeat(160) }),
    ).toEqual({
      answer: family.repeat(5000),
      excerpt: family.repeat(160),
    });
  });

  it('rejects values one grapheme beyond either limit', () => {
    expect(parseSubmissionInput({ answer: 'a'.repeat(5001), excerpt: 'ok' })).toMatchObject({
      code: 'INVALID_INPUT',
    });
    expect(parseSubmissionInput({ answer: 'ok', excerpt: 'a'.repeat(161) })).toMatchObject({
      code: 'INVALID_INPUT',
    });
  });
});
