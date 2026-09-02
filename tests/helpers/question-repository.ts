import type { Answer, Question } from '../../src/domain/question';
import { getQuestionState } from '../../src/domain/question-lifecycle';
import type { QuestionRepository, SubmitResult } from '../../src/repositories/question-repository';

export function createInMemoryQuestionRepository({
  question,
  answers = [],
}: {
  question: Question;
  answers?: Answer[];
}): QuestionRepository {
  const storedAnswers = [...answers];
  return {
    async getQuestion(id) {
      return id === question.id ? question : null;
    },
    async createDraft(input, now) {
      if (input.creatorUserId !== question.creatorUserId) return { kind: 'creator-missing' };
      Object.assign(question, input, { publishedAt: null, createdAt: now, updatedAt: now });
      return { kind: 'created', question };
    },
    async publish(questionId, creatorUserId, now) {
      if (questionId !== question.id) return { kind: 'missing' };
      if (creatorUserId !== question.creatorUserId) return { kind: 'creator-mismatch' };
      if (question.publishedAt !== null || now >= question.closesAt)
        return { kind: 'invalid-transition' };
      question.publishedAt = now;
      question.updatedAt = now;
      return { kind: 'published', question };
    },
    async submit(questionId, userId, input, now): Promise<SubmitResult> {
      if (questionId !== question.id) return { kind: 'missing' };
      if (getQuestionState(question, now) !== 'OPEN') return { kind: 'not-open' };
      if (storedAnswers.some((answer) => answer.userId === userId)) return { kind: 'duplicate' };
      const answer: Answer = {
        id: `answer-${storedAnswers.length + 1}`,
        questionId,
        userId,
        body: input.answer,
        excerpt: input.excerpt,
        createdAt: now,
      };
      storedAnswers.push(answer);
      return { kind: 'submitted', answer };
    },
    async getMine(questionId, userId) {
      return (
        storedAnswers.find(
          (answer) => answer.questionId === questionId && answer.userId === userId,
        ) ?? null
      );
    },
    async countAnswers(questionId) {
      return storedAnswers.filter((answer) => answer.questionId === questionId).length;
    },
    async listExcerpts(questionId) {
      return storedAnswers
        .filter((answer) => answer.questionId === questionId)
        .map(({ id, excerpt }) => ({ id, excerpt }));
    },
    async getAnswerBody(questionId, answerId) {
      return (
        storedAnswers.find((answer) => answer.questionId === questionId && answer.id === answerId)
          ?.body ?? null
      );
    },
  };
}

export function createAnswer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: 'answer-1',
    questionId: 'question-1',
    userId: 'user-1',
    body: 'A private answer body.',
    excerpt: 'A one-line excerpt.',
    createdAt: 10,
    ...overrides,
  };
}

export const openQuestion: Question = {
  id: 'question-1',
  creatorUserId: 'creator-1',
  body: 'What makes an answer useful?',
  language: 'en',
  publishedAt: 0,
  closesAt: 100,
  revealsAt: 100,
  createdAt: 0,
  updatedAt: 0,
};

export const draftQuestion: Question = { ...openQuestion, publishedAt: null };
export const closedQuestion: Question = { ...openQuestion, revealsAt: 200 };
export const revealedQuestion: Question = { ...openQuestion };
