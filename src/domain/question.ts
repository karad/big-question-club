export const MAX_ANSWER_LENGTH = 5000;
export const MAX_EXCERPT_LENGTH = 160;

export type Question = { id: string; body: string; closesAt: number; createdAt: number };
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

export function isOpen(question: Pick<Question, 'closesAt'>, now: number): boolean {
  return now < question.closesAt;
}
