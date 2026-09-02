export const MAX_ANSWER_LENGTH = 5000;
export const MAX_EXCERPT_LENGTH = 160;

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
};

export function toIsoTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
