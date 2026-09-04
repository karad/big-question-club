import {
  MAX_QUESTION_CLOSE_OFFSET_MS,
  MAX_QUESTION_GRAPHEMES,
  INFERRED_QUESTION_LANGUAGE,
  MIN_QUESTION_CLOSE_OFFSET_MS,
  MIN_QUESTION_GRAPHEMES,
} from './question';
import { countGraphemes } from './text';

export type QuestionDraftForm = {
  body: string;
  closesAtLocal: string;
  closesAt: string;
  timeZone: string;
  contentAcknowledged: boolean;
};

export type QuestionFormErrorKey =
  'body' | 'closesAt' | 'contentAcknowledged' | 'confirmPublication' | 'form';

export type QuestionFormErrors = Partial<Record<QuestionFormErrorKey, string>>;

export type ValidatedQuestionDraft = {
  body: string;
  language: string;
  closesAt: number;
  revealsAt: number;
};

export type ParseQuestionDraftResult =
  | { kind: 'valid'; value: ValidatedQuestionDraft; form: QuestionDraftForm }
  | { kind: 'invalid'; errors: QuestionFormErrors; form: QuestionDraftForm };

/**
 * Counts grapheme clusters in trimmed question text.
 * @param value - Raw question text.
 * @returns The number of user-perceived characters after trimming.
 */
export function countQuestionGraphemes(value: string): number {
  return countGraphemes(value.trim());
}

/**
 * Parses and validates an untrusted question draft form payload.
 * @param input - Form payload to validate.
 * @param now - Reference timestamp for deadline validation.
 * @returns A normalized draft or field-level validation errors.
 */
export function parseQuestionDraftForm(
  input: Record<string, unknown>,
  now: number,
): ParseQuestionDraftResult {
  const form: QuestionDraftForm = {
    body: stringField(input.body),
    closesAtLocal: stringField(input.closesAtLocal),
    closesAt: stringField(input.closesAt),
    timeZone: stringField(input.timeZone),
    contentAcknowledged: input.contentAcknowledged === 'on',
  };
  const errors: QuestionFormErrors = {};
  const body = form.body.trim();
  const bodyLength = countQuestionGraphemes(body);
  if (bodyLength < MIN_QUESTION_GRAPHEMES) {
    errors.body = `Enter at least ${MIN_QUESTION_GRAPHEMES} characters.`;
  } else if (bodyLength > MAX_QUESTION_GRAPHEMES) {
    errors.body = `Enter no more than ${MAX_QUESTION_GRAPHEMES.toLocaleString('en-US')} characters.`;
  }

  const closesAt = parseTimestamp(form.closesAt);
  if (closesAt === null || form.closesAtLocal.length === 0 || form.timeZone.length === 0) {
    errors.closesAt = 'Choose a valid answer deadline.';
  } else if (!isQuestionDeadlineAllowed(closesAt, now)) {
    errors.closesAt = 'Choose a deadline between 1 hour and 30 days from now.';
  }

  if (!form.contentAcknowledged) {
    errors.contentAcknowledged = 'Confirm that this question is suitable for public posting.';
  }

  if (Object.keys(errors).length > 0 || closesAt === null) {
    return { kind: 'invalid', errors, form };
  }

  return {
    kind: 'valid',
    value: { body, language: INFERRED_QUESTION_LANGUAGE, closesAt, revealsAt: closesAt },
    form,
  };
}

/**
 * Checks whether a closing timestamp falls within the allowed scheduling window.
 * @param closesAt - Proposed closing timestamp in milliseconds since the Unix epoch.
 * @param now - Reference timestamp in milliseconds since the Unix epoch.
 * @returns True when the deadline is neither too near nor too far away.
 */
export function isQuestionDeadlineAllowed(closesAt: number, now: number): boolean {
  return (
    Number.isSafeInteger(closesAt) &&
    closesAt >= now + MIN_QUESTION_CLOSE_OFFSET_MS &&
    closesAt <= now + MAX_QUESTION_CLOSE_OFFSET_MS
  );
}

/**
 * Checks whether a draft satisfies all requirements for publication.
 * @param question - Draft question to evaluate.
 * @param now - Reference timestamp in milliseconds since the Unix epoch.
 * @returns True when the question can be published.
 */
export function isPublishableQuestion(
  question: { body: string; language: string; closesAt: number; revealsAt: number },
  now: number,
): boolean {
  const length = countQuestionGraphemes(question.body);
  return (
    length >= MIN_QUESTION_GRAPHEMES &&
    length <= MAX_QUESTION_GRAPHEMES &&
    question.revealsAt === question.closesAt &&
    isQuestionDeadlineAllowed(question.closesAt, now)
  );
}

function parseTimestamp(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const timestamp = Number(value);
  return Number.isSafeInteger(timestamp) ? timestamp : null;
}

function stringField(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
