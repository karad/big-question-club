export const MAX_ANSWER_LENGTH = 5000;
export const MAX_EXCERPT_LENGTH = 160;
export const MIN_QUESTION_GRAPHEMES = 10;
export const MAX_QUESTION_GRAPHEMES = 1000;
export const MIN_QUESTION_CLOSE_OFFSET_MS = 60 * 60 * 1000;
export const MAX_QUESTION_CLOSE_OFFSET_MS = 30 * 24 * 60 * 60 * 1000;
export const QUESTION_LANGUAGES = ['en', 'ja'] as const;

export type QuestionLanguage = (typeof QUESTION_LANGUAGES)[number];

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

export function toIsoTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
