import type { Question } from './question';

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

export function parsePage(value: string | undefined): number {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : 1;
}

export function createQuestionListPage(
  items: QuestionListItem[],
  totalItems: number,
  requestedPage: number,
  pageSize = QUESTION_PAGE_SIZE,
): QuestionListPage {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return { items, page: requestedPage, pageSize, totalItems, totalPages };
}
