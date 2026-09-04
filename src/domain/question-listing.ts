import type { Question } from './question';

/** Number of questions displayed on one list page. */
export const QUESTION_PAGE_SIZE = 20;

export type QuestionListKind = 'open' | 'revealed';
export type QuestionListItem = {
  question: Question;
  answerCount: number;
  hasAnswered: boolean | null;
  promptAvailable: boolean;
};
export type QuestionListPage = {
  items: QuestionListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

/**
 * Parses a one-based page number from a query parameter.
 * @param value - Raw query-parameter value.
 * @returns A positive safe integer, or 1 when the value is invalid.
 */
export function parsePage(value: string | undefined): number {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : 1;
}

/**
 * Creates normalized pagination metadata for a question list.
 * @param items - Questions returned for the requested page.
 * @param totalItems - Total number of matching questions.
 * @param requestedPage - Requested one-based page number.
 * @param pageSize - Maximum number of items per page.
 * @returns The items and normalized pagination metadata.
 */
export function createQuestionListPage(
  items: QuestionListItem[],
  totalItems: number,
  requestedPage: number,
  pageSize = QUESTION_PAGE_SIZE,
): QuestionListPage {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return { items, page: requestedPage, pageSize, totalItems, totalPages };
}
