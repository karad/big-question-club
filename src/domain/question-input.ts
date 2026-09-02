import {
  MAX_QUESTION_CLOSE_OFFSET_MS,
  MAX_QUESTION_GRAPHEMES,
  MIN_QUESTION_CLOSE_OFFSET_MS,
  MIN_QUESTION_GRAPHEMES,
  QUESTION_LANGUAGES,
  type QuestionLanguage,
} from './question';
import { countGraphemes } from './text';

export type QuestionDraftForm = {
  body: string;
  language: string;
  closesAtLocal: string;
  closesAt: string;
  timeZone: string;
  contentAcknowledged: boolean;
};

export type QuestionFormErrorKey =
  'body' | 'language' | 'closesAt' | 'contentAcknowledged' | 'confirmPublication' | 'form';

export type QuestionFormErrors = Partial<Record<QuestionFormErrorKey, string>>;

export type ValidatedQuestionDraft = {
  body: string;
  language: QuestionLanguage;
  closesAt: number;
  revealsAt: number;
};

export type ParseQuestionDraftResult =
  | { kind: 'valid'; value: ValidatedQuestionDraft; form: QuestionDraftForm }
  | { kind: 'invalid'; errors: QuestionFormErrors; form: QuestionDraftForm };

export function countQuestionGraphemes(value: string): number {
  return countGraphemes(value.trim());
}

export function parseQuestionDraftForm(
  input: Record<string, unknown>,
  now: number,
): ParseQuestionDraftResult {
  const form: QuestionDraftForm = {
    body: stringField(input.body),
    language: stringField(input.language),
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

  const language = isQuestionLanguage(form.language) ? form.language : null;
  if (language === null) errors.language = 'Choose English or Japanese.';

  const closesAt = parseTimestamp(form.closesAt);
  if (closesAt === null || form.closesAtLocal.length === 0 || form.timeZone.length === 0) {
    errors.closesAt = 'Choose a valid answer deadline.';
  } else if (!isQuestionDeadlineAllowed(closesAt, now)) {
    errors.closesAt = 'Choose a deadline between 1 hour and 30 days from now.';
  }

  if (!form.contentAcknowledged) {
    errors.contentAcknowledged = 'Confirm that this question is suitable for public posting.';
  }

  if (Object.keys(errors).length > 0 || language === null || closesAt === null) {
    return { kind: 'invalid', errors, form };
  }

  return {
    kind: 'valid',
    value: { body, language, closesAt, revealsAt: closesAt },
    form,
  };
}

export function isQuestionDeadlineAllowed(closesAt: number, now: number): boolean {
  return (
    Number.isSafeInteger(closesAt) &&
    closesAt >= now + MIN_QUESTION_CLOSE_OFFSET_MS &&
    closesAt <= now + MAX_QUESTION_CLOSE_OFFSET_MS
  );
}

export function isPublishableQuestion(
  question: { body: string; language: string; closesAt: number; revealsAt: number },
  now: number,
): boolean {
  const length = countQuestionGraphemes(question.body);
  return (
    length >= MIN_QUESTION_GRAPHEMES &&
    length <= MAX_QUESTION_GRAPHEMES &&
    isQuestionLanguage(question.language) &&
    question.revealsAt === question.closesAt &&
    isQuestionDeadlineAllowed(question.closesAt, now)
  );
}

export function isQuestionLanguage(value: string): value is QuestionLanguage {
  return QUESTION_LANGUAGES.some((language) => language === value);
}

function parseTimestamp(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const timestamp = Number(value);
  return Number.isSafeInteger(timestamp) ? timestamp : null;
}

function stringField(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
