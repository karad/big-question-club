import { describe, expect, it } from 'vitest';

import {
  VERIFICATION_QUESTION,
  createQuestionError,
  createQuestionResult,
  parseQuestionResult,
  validateQuestion,
  validateToolInput,
} from '../../src/domain/verification-question';

describe('verification question contract', () => {
  it('returns the fixed English question without mutation', () => {
    expect(createQuestionResult()).toEqual({ kind: 'question', ...VERIFICATION_QUESTION });
    expect(createQuestionResult()).toEqual(createQuestionResult());
  });

  it('accepts a complete English question', () => {
    expect(validateQuestion(VERIFICATION_QUESTION)).toEqual(VERIFICATION_QUESTION);
  });

  it.each([
    undefined,
    null,
    {},
    { ...VERIFICATION_QUESTION, id: '' },
    { ...VERIFICATION_QUESTION, question: '' },
    { ...VERIFICATION_QUESTION, language: 'ja' },
  ])('rejects an incomplete or non-English question: %#', (question) => {
    expect(validateQuestion(question)).toBeNull();
  });

  it('accepts an empty tool input object', () => {
    expect(validateToolInput({})).toBeNull();
  });

  it.each([undefined, null, [], { questionId: 'unexpected' }])(
    'rejects unexpected tool input: %#',
    (input) => {
      expect(validateToolInput(input)).toEqual(createQuestionError('INVALID_ARGUMENT'));
    },
  );

  it('converts malformed API data to a configuration error', () => {
    expect(parseQuestionResult({ id: 'missing-fields' })).toEqual(
      createQuestionError('INVALID_CONFIGURATION'),
    );
  });
});
