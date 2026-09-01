import { describe, expect, it } from 'vitest';

import {
  SAFETY_VERIFICATION_CASES,
  createQuestionError,
  getSafetyVerificationQuestion,
  parseQuestionResult,
  validateQuestion,
  validateToolInput,
} from '../../src/domain/verification-question';

describe('agent safety verification question contract', () => {
  it('defines fourteen unique cases split evenly between Japanese and English', () => {
    expect(SAFETY_VERIFICATION_CASES).toHaveLength(14);
    expect(new Set(SAFETY_VERIFICATION_CASES.map(({ id }) => id)).size).toBe(14);
    expect(SAFETY_VERIFICATION_CASES.filter(({ language }) => language === 'ja')).toHaveLength(7);
    expect(SAFETY_VERIFICATION_CASES.filter(({ language }) => language === 'en')).toHaveLength(7);
  });

  it('includes normal questions and all planned attack categories', () => {
    expect(SAFETY_VERIFICATION_CASES.filter(({ category }) => category === 'normal')).toHaveLength(
      6,
    );
    expect(
      SAFETY_VERIFICATION_CASES.filter(({ category }) => category === 'private_context_request'),
    ).toHaveLength(2);
    expect(
      SAFETY_VERIFICATION_CASES.filter(({ category }) => category === 'prompt_injection'),
    ).toHaveLength(6);
  });

  it('returns only approved public fields for a known case', () => {
    expect(getSafetyVerificationQuestion('case-ja-01')).toEqual({
      id: 'case-ja-01',
      question: expect.any(String),
      language: 'ja',
      category: 'normal',
      expectedBehavior: expect.any(String),
    });
    expect(Object.keys(getSafetyVerificationQuestion('case-ja-01') ?? {}).sort()).toEqual([
      'category',
      'expectedBehavior',
      'id',
      'language',
      'question',
    ]);
  });

  it('returns null for an unknown case', () => {
    expect(getSafetyVerificationQuestion('unknown-case')).toBeNull();
  });

  it('accepts a complete Japanese or English public question', () => {
    for (const question of SAFETY_VERIFICATION_CASES) {
      expect(validateQuestion(question)).toEqual(question);
    }
  });

  it.each([
    undefined,
    null,
    {},
    { ...SAFETY_VERIFICATION_CASES[0], id: '' },
    { ...SAFETY_VERIFICATION_CASES[0], question: '' },
    { ...SAFETY_VERIFICATION_CASES[0], language: 'fr' },
    { ...SAFETY_VERIFICATION_CASES[0], privateContext: 'unexpected' },
  ])('rejects malformed or overbroad public question data: %#', (question) => {
    expect(validateQuestion(question)).toBeNull();
  });

  it('accepts only an input object with one non-empty case ID', () => {
    expect(validateToolInput({ caseId: 'case-ja-01' })).toEqual({ caseId: 'case-ja-01' });
  });

  it.each([undefined, null, [], {}, { caseId: '' }, { caseId: 'case-ja-01', extra: true }])(
    'rejects invalid tool input: %#',
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
