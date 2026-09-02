import { describe, expect, it } from 'vitest';
import {
  countQuestionGraphemes,
  isPublishableQuestion,
  parseQuestionDraftForm,
} from '../../src/domain/question-input';

const now = 1_000_000;
const hour = 60 * 60 * 1000;
const day = 24 * hour;

function form(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    body: 'A useful question?',
    closesAtLocal: '2026-09-02T12:00',
    closesAt: String(now + 2 * hour),
    timeZone: 'Asia/Tokyo',
    contentAcknowledged: 'on',
    ...overrides,
  };
}

describe('Question draft input', () => {
  it.each([
    ['ten ASCII graphemes', 'abcdefghij', 10],
    ['one emoji', '👨‍👩‍👧‍👦', 1],
    ['one flag', '🇯🇵', 1],
    ['one combining grapheme', 'é', 1],
    ['trims surrounding whitespace', '  abc  ', 3],
    ['counts internal newline', 'a\nb', 3],
  ])('counts %s', (_label, value, expected) => {
    expect(countQuestionGraphemes(value)).toBe(expected);
  });

  it.each([
    ['minimum body', { body: 'abcdefghij' }],
    ['maximum body', { body: 'a'.repeat(1000) }],
    ['ten family emojis', { body: '👨‍👩‍👧‍👦'.repeat(10) }],
    ['Japanese body', { body: '人類が大切にするべき問いは何ですか？' }],
    ['French body', { body: 'Quelle question devrions-nous poser ?' }],
    ['minimum deadline', { closesAt: String(now + hour) }],
    ['maximum deadline', { closesAt: String(now + 30 * day) }],
    ['UTC zone', { timeZone: 'UTC' }],
  ])('accepts %s', (_label, overrides) => {
    expect(parseQuestionDraftForm(form(overrides), now).kind).toBe('valid');
  });

  it.each([
    ['blank body', { body: '   ' }, 'body', 'Enter at least 10 characters.'],
    ['nine characters', { body: 'a'.repeat(9) }, 'body', 'Enter at least 10 characters.'],
    ['1001 characters', { body: 'a'.repeat(1001) }, 'body', 'Enter no more than 1,000 characters.'],
    [
      'deadline one millisecond too soon',
      { closesAt: String(now + hour - 1) },
      'closesAt',
      'Choose a deadline between 1 hour and 30 days from now.',
    ],
    [
      'deadline one millisecond too late',
      { closesAt: String(now + 30 * day + 1) },
      'closesAt',
      'Choose a deadline between 1 hour and 30 days from now.',
    ],
    ['missing timestamp', { closesAt: '' }, 'closesAt', 'Choose a valid answer deadline.'],
    ['decimal timestamp', { closesAt: '1.5' }, 'closesAt', 'Choose a valid answer deadline.'],
    ['negative timestamp', { closesAt: '-1' }, 'closesAt', 'Choose a valid answer deadline.'],
    [
      'unsafe timestamp',
      { closesAt: '99999999999999999999' },
      'closesAt',
      'Choose a valid answer deadline.',
    ],
    ['missing local value', { closesAtLocal: '' }, 'closesAt', 'Choose a valid answer deadline.'],
    ['missing timezone', { timeZone: '' }, 'closesAt', 'Choose a valid answer deadline.'],
    [
      'missing acknowledgment',
      { contentAcknowledged: undefined },
      'contentAcknowledged',
      'Confirm that this question is suitable for public posting.',
    ],
    [
      'false acknowledgment',
      { contentAcknowledged: 'false' },
      'contentAcknowledged',
      'Confirm that this question is suitable for public posting.',
    ],
  ])('rejects %s', (_label, overrides, key, message) => {
    const result = parseQuestionDraftForm(form(overrides), now);
    expect(result.kind).toBe('invalid');
    if (result.kind === 'invalid')
      expect(result.errors[key as keyof typeof result.errors]).toBe(message);
  });

  it('normalizes body and derives reveal from close', () => {
    const result = parseQuestionDraftForm(form({ body: '  A useful question?  ' }), now);
    expect(result).toMatchObject({
      kind: 'valid',
      value: { body: 'A useful question?', language: 'auto', revealsAt: now + 2 * hour },
    });
  });

  it('ignores an undeclared language value and lets the agent infer it from the question', () => {
    const result = parseQuestionDraftForm(form({ language: 'fr' }), now);
    expect(result).toMatchObject({ kind: 'valid', value: { language: 'auto' } });
  });

  it.each([
    [
      'body too short',
      { body: 'short', language: 'auto', closesAt: now + hour, revealsAt: now + hour },
    ],
    [
      'different reveal',
      {
        body: 'A useful question?',
        language: 'auto',
        closesAt: now + hour,
        revealsAt: now + 2 * hour,
      },
    ],
  ])('rejects non-publishable stored question: %s', (_label, question) => {
    expect(isPublishableQuestion(question, now)).toBe(false);
  });
});
