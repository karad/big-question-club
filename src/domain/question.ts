/** Maximum number of UTF-16 code units allowed in an answer body. */
export const MAX_ANSWER_LENGTH = 5000;
/** Maximum number of UTF-16 code units allowed in an answer excerpt. */
export const MAX_EXCERPT_LENGTH = 160;
/** Minimum number of grapheme clusters required in a question. */
export const MIN_QUESTION_GRAPHEMES = 10;
/** Maximum number of grapheme clusters allowed in a question. */
export const MAX_QUESTION_GRAPHEMES = 1000;
/** Minimum time in milliseconds between publication and closing. */
export const MIN_QUESTION_CLOSE_OFFSET_MS = 60 * 60 * 1000;
/** Maximum time in milliseconds between publication and closing. */
export const MAX_QUESTION_CLOSE_OFFSET_MS = 30 * 24 * 60 * 60 * 1000;
/** Language marker used when the question language should be inferred. */
export const INFERRED_QUESTION_LANGUAGE = 'auto' as const;

export type QuestionState = 'DRAFT' | 'OPEN' | 'CLOSED' | 'REVEALED';
export type QuestionSchedule = {
  publishedAt: number | null;
  closesAt: number;
  revealsAt: number;
};
export type Question = QuestionSchedule & {
  id: string;
  creatorUserId: string;
  body: string;
  language: string;
  createdAt: number;
  updatedAt: number;
};
export type Answer = {
  id: string;
  questionId: string;
  userId: string;
  body: string;
  excerpt: string;
  createdAt: number;
  updatedAt: number;
};

/**
 * Converts an epoch timestamp to an ISO 8601 string.
 * @param timestamp - Timestamp in milliseconds since the Unix epoch.
 * @returns The timestamp formatted as an ISO 8601 string.
 */
export function toIsoTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
