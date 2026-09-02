import {
  MAX_QUESTION_CLOSE_OFFSET_MS,
  MIN_QUESTION_CLOSE_OFFSET_MS,
  type Answer,
  type Question,
} from '../../src/domain/question';
import { getQuestionState } from '../../src/domain/question-lifecycle';
import type { QuestionRepository, SubmitResult } from '../../src/repositories/question-repository';

export function createInMemoryQuestionRepository({
  question,
  questions,
  answers = [],
}: {
  question?: Question;
  questions?: Question[];
  answers?: Answer[];
} = {}): QuestionRepository {
  const storedQuestions = (questions ?? (question === undefined ? [] : [question])).map((item) => ({
    ...item,
  }));
  const storedAnswers = answers.map((answer) => ({ ...answer }));
  return {
    async getQuestion(id) {
      return storedQuestions.find((item) => item.id === id) ?? null;
    },
    async getOwnedQuestion(id, creatorUserId) {
      return (
        storedQuestions.find((item) => item.id === id && item.creatorUserId === creatorUserId) ??
        null
      );
    },
    async createDraft(input, now) {
      const created: Question = {
        id: `question-${storedQuestions.length + 1}`,
        ...input,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      storedQuestions.push(created);
      return { kind: 'created', question: created };
    },
    async updateDraft(input, now) {
      const current = storedQuestions.find(
        (item) => item.id === input.questionId && item.creatorUserId === input.creatorUserId,
      );
      if (current === undefined) return { kind: 'unavailable-to-owner' };
      if (current.publishedAt !== null) return { kind: 'already-published' };
      if (current.updatedAt !== input.expectedUpdatedAt) return { kind: 'conflict' };
      Object.assign(current, input, { updatedAt: now });
      return { kind: 'updated', question: current };
    },
    async publish(questionId, creatorUserId, now, expectedUpdatedAt) {
      const current = storedQuestions.find((item) => item.id === questionId);
      if (current === undefined) return { kind: 'missing' };
      if (current.creatorUserId !== creatorUserId) return { kind: 'creator-mismatch' };
      if (
        current.publishedAt !== null ||
        (expectedUpdatedAt !== undefined && current.updatedAt !== expectedUpdatedAt) ||
        current.closesAt < now + MIN_QUESTION_CLOSE_OFFSET_MS ||
        current.closesAt > now + MAX_QUESTION_CLOSE_OFFSET_MS ||
        current.revealsAt !== current.closesAt
      ) {
        return { kind: 'invalid-transition' };
      }
      current.publishedAt = now;
      current.updatedAt = now;
      return { kind: 'published', question: current };
    },
    async listByCreator(creatorUserId) {
      return storedQuestions
        .filter((item) => item.creatorUserId === creatorUserId)
        .sort((left, right) => right.createdAt - left.createdAt || right.id.localeCompare(left.id))
        .map((item) => ({
          question: item,
          answerCount: storedAnswers.filter((answer) => answer.questionId === item.id).length,
        }));
    },
    async listOpenQuestions(snapshotNow) {
      return storedQuestions
        .filter((item) => getQuestionState(item, snapshotNow) === 'OPEN')
        .sort(
          (left, right) =>
            left.closesAt - right.closesAt ||
            (left.publishedAt ?? 0) - (right.publishedAt ?? 0) ||
            left.id.localeCompare(right.id),
        )
        .map((item) => ({
          question: item,
          answerCount: storedAnswers.filter((answer) => answer.questionId === item.id).length,
        }));
    },
    async submit(questionId, userId, input, now): Promise<SubmitResult> {
      const current = storedQuestions.find((item) => item.id === questionId);
      if (current === undefined) return { kind: 'missing' };
      if (current.publishedAt === null) return { kind: 'missing' };
      if (getQuestionState(current, now) !== 'OPEN') return { kind: 'not-open' };
      if (
        storedAnswers.some((answer) => answer.questionId === questionId && answer.userId === userId)
      ) {
        return { kind: 'duplicate' };
      }
      const answer: Answer = {
        id: `answer-${storedAnswers.length + 1}`,
        questionId,
        userId,
        body: input.answer,
        excerpt: input.excerpt,
        createdAt: now,
        updatedAt: now,
      };
      storedAnswers.push(answer);
      return { kind: 'submitted', answer };
    },
    async updateAnswer(questionId, userId, input, now) {
      const current = storedQuestions.find((item) => item.id === questionId);
      if (current === undefined) return { kind: 'missing' };
      if (current.publishedAt === null) return { kind: 'missing' };
      if (getQuestionState(current, now) !== 'OPEN') return { kind: 'not-open' };
      const answer = storedAnswers.find(
        (item) => item.questionId === questionId && item.userId === userId,
      );
      if (answer === undefined) return { kind: 'answer-missing' };
      Object.assign(answer, { body: input.answer, excerpt: input.excerpt, updatedAt: now });
      return { kind: 'updated', answer };
    },
    async removeAnswer(questionId, userId, now) {
      const current = storedQuestions.find((item) => item.id === questionId);
      if (current === undefined) return { kind: 'missing' };
      if (current.publishedAt === null) return { kind: 'missing' };
      if (getQuestionState(current, now) !== 'OPEN') return { kind: 'not-open' };
      const index = storedAnswers.findIndex(
        (item) => item.questionId === questionId && item.userId === userId,
      );
      if (index < 0) return { kind: 'answer-missing' };
      storedAnswers.splice(index, 1);
      return { kind: 'removed' };
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
    async getAnswerCount(questionId) {
      return {
        answerCount: storedAnswers.filter((answer) => answer.questionId === questionId).length,
      };
    },
    async getOwnAnswer(questionId, userId) {
      const answer = storedAnswers.find(
        (item) => item.questionId === questionId && item.userId === userId,
      );
      if (answer === undefined) return null;
      const { body, createdAt, excerpt, questionId: ownedQuestionId, updatedAt } = answer;
      return { body, createdAt, excerpt, questionId: ownedQuestionId, updatedAt };
    },
    async listRevealedExcerpts(questionId) {
      return storedAnswers
        .filter((answer) => answer.questionId === questionId)
        .sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id))
        .map(({ id, excerpt }) => ({ id, excerpt }));
    },
    async getRevealedAnswerBody(questionId, answerId) {
      const answer = storedAnswers.find(
        (item) => item.questionId === questionId && item.id === answerId,
      );
      return answer === undefined ? null : { id: answer.id, body: answer.body };
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
    updatedAt: 10,
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
export const otherQuestion: Question = {
  ...openQuestion,
  id: 'question-2',
  body: 'How should a second question stay isolated?',
};
export const answerDeadline = openQuestion.closesAt;
export const primaryUserId = 'user-1';
export const otherUserId = 'user-2';
