import { describe, expect, it } from 'vitest';
import { answerError, parseSubmissionInput } from '../../src/domain/answer-submission';
import { MAX_ANSWER_LENGTH, MAX_EXCERPT_LENGTH } from '../../src/domain/question';

describe('Answer submission input', () => {
  it('accepts a body and a single-line excerpt', () => {
    expect(parseSubmissionInput({ answer: 'Answer', excerpt: 'Summary' })).toEqual({
      answer: 'Answer',
      excerpt: 'Summary',
    });
  });
  it.each([
    {},
    { answer: '', excerpt: 'Summary' },
    { answer: 'Answer', excerpt: '' },
    { answer: 'Answer', excerpt: 'two\nlines' },
    { answer: 'a'.repeat(MAX_ANSWER_LENGTH + 1), excerpt: 'Summary' },
    { answer: 'Answer', excerpt: 'a'.repeat(MAX_EXCERPT_LENGTH + 1) },
    { answer: 'Answer', excerpt: 'Summary', extra: true },
  ])('rejects invalid Answer input: %#', (input) => {
    expect(parseSubmissionInput(input)).toEqual(answerError('INVALID_ANSWER'));
  });

  it('uses stable API error contracts for authentication, a closed question, and duplicates', () => {
    expect(answerError('AUTHENTICATION_REQUIRED')).toEqual({
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Sign in to submit an answer.',
    });
    expect(answerError('QUESTION_CLOSED')).toEqual({
      code: 'QUESTION_CLOSED',
      message: 'This question is closed.',
    });
    expect(answerError('ANSWER_ALREADY_SUBMITTED')).toEqual({
      code: 'ANSWER_ALREADY_SUBMITTED',
      message: 'An answer has already been submitted.',
    });
  });
});
