import { and, asc, count, desc, eq } from 'drizzle-orm';
import { parseSubmissionInput, type SubmissionInput } from '../domain/answer-submission';
import {
  MAX_QUESTION_CLOSE_OFFSET_MS,
  MIN_QUESTION_CLOSE_OFFSET_MS,
  type Answer,
  type Question,
} from '../domain/question';
import { isPublishableQuestion, type ValidatedQuestionDraft } from '../domain/question-input';
import { validateQuestionSchedule } from '../domain/question-lifecycle';
import { createDatabase } from '../db/client';
import { answers, questions, users } from '../db/schema';

export type CreateDraftInput = ValidatedQuestionDraft & { creatorUserId: string };
export type CreateDraftResult =
  | { kind: 'created'; question: Question }
  | { kind: 'creator-missing' }
  | { kind: 'invalid' }
  | { kind: 'unavailable' };
export type PublishResult =
  | { kind: 'published'; question: Question }
  | { kind: 'missing' }
  | { kind: 'creator-mismatch' }
  | { kind: 'invalid-transition' }
  | { kind: 'unavailable' };
export type UpdateDraftInput = ValidatedQuestionDraft & {
  questionId: string;
  creatorUserId: string;
  expectedUpdatedAt: number;
};
export type UpdateDraftResult =
  | { kind: 'updated'; question: Question }
  | { kind: 'unavailable-to-owner' }
  | { kind: 'already-published' }
  | { kind: 'conflict' }
  | { kind: 'invalid' }
  | { kind: 'unavailable' };
export type OwnedQuestionSummary = { question: Question; answerCount: number };
export type AnswerCountView = { answerCount: number };
export type OwnAnswerView = Pick<
  Answer,
  'body' | 'createdAt' | 'excerpt' | 'questionId' | 'updatedAt'
>;
export type RevealedExcerptView = Pick<Answer, 'excerpt' | 'id'>;
export type RevealedBodyView = Pick<Answer, 'body' | 'id'>;
export type SubmitResult =
  | { kind: 'submitted'; answer: Answer }
  | { kind: 'duplicate' }
  | { kind: 'missing' }
  | { kind: 'not-open' }
  | { kind: 'reference-missing' }
  | { kind: 'invalid' }
  | { kind: 'unavailable' };
export type UpdateAnswerResult =
  | { kind: 'updated'; answer: Answer }
  | { kind: 'missing' }
  | { kind: 'answer-missing' }
  | { kind: 'not-open' }
  | { kind: 'invalid' }
  | { kind: 'unavailable' };
export type RemoveAnswerResult =
  | { kind: 'removed' }
  | { kind: 'missing' }
  | { kind: 'answer-missing' }
  | { kind: 'not-open' }
  | { kind: 'unavailable' };

export interface QuestionRepository {
  getQuestion(id: string): Promise<Question | null>;
  getOwnedQuestion(id: string, creatorUserId: string): Promise<Question | null>;
  createDraft(input: CreateDraftInput, now: number): Promise<CreateDraftResult>;
  updateDraft(input: UpdateDraftInput, now: number): Promise<UpdateDraftResult>;
  publish(
    questionId: string,
    creatorUserId: string,
    now: number,
    expectedUpdatedAt?: number,
  ): Promise<PublishResult>;
  listByCreator(creatorUserId: string): Promise<OwnedQuestionSummary[]>;
  submit(
    questionId: string,
    userId: string,
    input: SubmissionInput,
    now: number,
  ): Promise<SubmitResult>;
  updateAnswer(
    questionId: string,
    userId: string,
    input: SubmissionInput,
    now: number,
  ): Promise<UpdateAnswerResult>;
  removeAnswer(questionId: string, userId: string, now: number): Promise<RemoveAnswerResult>;
  getMine(questionId: string, userId: string): Promise<Answer | null>;
  countAnswers(questionId: string): Promise<number>;
  listExcerpts(questionId: string): Promise<Array<Pick<Answer, 'id' | 'excerpt'>>>;
  getAnswerBody(questionId: string, answerId: string): Promise<string | null>;
  getAnswerCount(questionId: string): Promise<AnswerCountView>;
  getOwnAnswer(questionId: string, userId: string): Promise<OwnAnswerView | null>;
  listRevealedExcerpts(questionId: string): Promise<RevealedExcerptView[]>;
  getRevealedAnswerBody(questionId: string, answerId: string): Promise<RevealedBodyView | null>;
}

export function createQuestionRepository(database: D1Database): QuestionRepository {
  const db = createDatabase(database);
  const repository: QuestionRepository = {
    async getQuestion(id) {
      const [question] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
      return question ?? null;
    },
    async getOwnedQuestion(id, creatorUserId) {
      const [question] = await db
        .select()
        .from(questions)
        .where(and(eq(questions.id, id), eq(questions.creatorUserId, creatorUserId)))
        .limit(1);
      return question ?? null;
    },
    async createDraft(input, now) {
      if (
        !isPublishableQuestion(input, now) ||
        validateQuestionSchedule(
          { publishedAt: null, closesAt: input.closesAt, revealsAt: input.revealsAt },
          now,
        ) !== null
      ) {
        return { kind: 'invalid' };
      }
      const question: Question = {
        id: crypto.randomUUID(),
        ...input,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      try {
        await db.insert(questions).values(question);
        return { kind: 'created', question };
      } catch {
        const [creator] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, input.creatorUserId))
          .limit(1);
        return creator === undefined ? { kind: 'creator-missing' } : { kind: 'unavailable' };
      }
    },
    async updateDraft(input, now) {
      if (
        !isPublishableQuestion(input, now) ||
        validateQuestionSchedule(
          { publishedAt: null, closesAt: input.closesAt, revealsAt: input.revealsAt },
          now,
        ) !== null
      ) {
        return { kind: 'invalid' };
      }
      try {
        const result = await database
          .prepare(
            'UPDATE questions SET body = ?, language = ?, closes_at = ?, reveals_at = ?, updated_at = ? WHERE id = ? AND creator_user_id = ? AND published_at IS NULL AND updated_at = ?',
          )
          .bind(
            input.body,
            input.language,
            input.closesAt,
            input.revealsAt,
            now,
            input.questionId,
            input.creatorUserId,
            input.expectedUpdatedAt,
          )
          .run();
        if (result.meta.changes === 1) {
          const question = await repository.getOwnedQuestion(input.questionId, input.creatorUserId);
          return question === null ? { kind: 'unavailable' } : { kind: 'updated', question };
        }
        const current = await repository.getOwnedQuestion(input.questionId, input.creatorUserId);
        if (current === null) return { kind: 'unavailable-to-owner' };
        if (current.publishedAt !== null) return { kind: 'already-published' };
        return { kind: 'conflict' };
      } catch {
        return { kind: 'unavailable' };
      }
    },
    async publish(questionId, creatorUserId, now, expectedUpdatedAt) {
      try {
        const updatedAtCondition = expectedUpdatedAt === undefined ? '' : ' AND updated_at = ?';
        const bindings: unknown[] = [
          now,
          now,
          questionId,
          creatorUserId,
          now + MIN_QUESTION_CLOSE_OFFSET_MS,
          now + MAX_QUESTION_CLOSE_OFFSET_MS,
        ];
        if (expectedUpdatedAt !== undefined) bindings.push(expectedUpdatedAt);
        const result = await database
          .prepare(
            `UPDATE questions SET published_at = ?, updated_at = ? WHERE id = ? AND creator_user_id = ? AND published_at IS NULL AND ? <= closes_at AND closes_at <= ? AND reveals_at = closes_at${updatedAtCondition}`,
          )
          .bind(...bindings)
          .run();
        if (result.meta.changes === 1) {
          const question = await repository.getQuestion(questionId);
          return question === null ? { kind: 'unavailable' } : { kind: 'published', question };
        }
        const current = await repository.getQuestion(questionId);
        if (current === null) return { kind: 'missing' };
        if (current.creatorUserId !== creatorUserId) return { kind: 'creator-mismatch' };
        return { kind: 'invalid-transition' };
      } catch {
        return { kind: 'unavailable' };
      }
    },
    async listByCreator(creatorUserId) {
      const rows = await db
        .select({ question: questions, answerCount: count(answers.id) })
        .from(questions)
        .leftJoin(answers, eq(answers.questionId, questions.id))
        .where(eq(questions.creatorUserId, creatorUserId))
        .groupBy(questions.id)
        .orderBy(desc(questions.createdAt), desc(questions.id));
      return rows.map(({ question, answerCount }) => ({ question, answerCount }));
    },
    async submit(questionId, userId, input, now) {
      const id = crypto.randomUUID();
      try {
        const result = await database
          .prepare(
            'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at, updated_at) SELECT ?, q.id, ?, ?, ?, ?, ? FROM questions q WHERE q.id = ? AND q.published_at IS NOT NULL AND q.published_at <= ? AND ? < q.closes_at',
          )
          .bind(id, userId, input.answer, input.excerpt, now, now, questionId, now, now)
          .run();
        if (result.meta.changes === 1) {
          return {
            kind: 'submitted',
            answer: {
              id,
              questionId,
              userId,
              body: input.answer,
              excerpt: input.excerpt,
              createdAt: now,
              updatedAt: now,
            },
          };
        }
        const question = await repository.getQuestion(questionId);
        return question === null || question.publishedAt === null
          ? { kind: 'missing' }
          : { kind: 'not-open' };
      } catch {
        if ((await repository.getMine(questionId, userId)) !== null) return { kind: 'duplicate' };
        if ((await repository.getQuestion(questionId)) === null) return { kind: 'missing' };
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        if (user === undefined) return { kind: 'reference-missing' };
        return 'code' in parseSubmissionInput(input)
          ? { kind: 'invalid' }
          : { kind: 'unavailable' };
      }
    },
    async updateAnswer(questionId, userId, input, now) {
      if ('code' in parseSubmissionInput(input)) return { kind: 'invalid' };
      try {
        const result = await database
          .prepare(
            'UPDATE answers SET body = ?, excerpt = ?, updated_at = ? WHERE question_id = ? AND user_id = ? AND EXISTS (SELECT 1 FROM questions q WHERE q.id = answers.question_id AND q.published_at IS NOT NULL AND q.published_at <= ? AND ? < q.closes_at)',
          )
          .bind(input.answer, input.excerpt, now, questionId, userId, now, now)
          .run();
        if (result.meta.changes === 1) {
          const answer = await repository.getMine(questionId, userId);
          return answer === null ? { kind: 'unavailable' } : { kind: 'updated', answer };
        }
        const question = await repository.getQuestion(questionId);
        if (question === null || question.publishedAt === null) return { kind: 'missing' };
        if (question.publishedAt > now || now >= question.closesAt) return { kind: 'not-open' };
        return (await repository.getMine(questionId, userId)) === null
          ? { kind: 'answer-missing' }
          : { kind: 'unavailable' };
      } catch {
        return { kind: 'unavailable' };
      }
    },
    async removeAnswer(questionId, userId, now) {
      try {
        const result = await database
          .prepare(
            'DELETE FROM answers WHERE question_id = ? AND user_id = ? AND EXISTS (SELECT 1 FROM questions q WHERE q.id = answers.question_id AND q.published_at IS NOT NULL AND q.published_at <= ? AND ? < q.closes_at)',
          )
          .bind(questionId, userId, now, now)
          .run();
        if (result.meta.changes === 1) return { kind: 'removed' };
        const question = await repository.getQuestion(questionId);
        if (question === null || question.publishedAt === null) return { kind: 'missing' };
        if (question.publishedAt > now || now >= question.closesAt) return { kind: 'not-open' };
        return (await repository.getMine(questionId, userId)) === null
          ? { kind: 'answer-missing' }
          : { kind: 'unavailable' };
      } catch {
        return { kind: 'unavailable' };
      }
    },
    async getMine(questionId, userId) {
      const [answer] = await db
        .select()
        .from(answers)
        .where(and(eq(answers.questionId, questionId), eq(answers.userId, userId)))
        .limit(1);
      return answer ?? null;
    },
    async countAnswers(questionId) {
      const [result] = await db
        .select({ value: count() })
        .from(answers)
        .where(eq(answers.questionId, questionId));
      return result?.value ?? 0;
    },
    async listExcerpts(questionId) {
      return db
        .select({ id: answers.id, excerpt: answers.excerpt })
        .from(answers)
        .where(eq(answers.questionId, questionId))
        .orderBy(asc(answers.createdAt), asc(answers.id));
    },
    async getAnswerBody(questionId, answerId) {
      const [answer] = await db
        .select({ body: answers.body })
        .from(answers)
        .where(and(eq(answers.questionId, questionId), eq(answers.id, answerId)))
        .limit(1);
      return answer?.body ?? null;
    },
    async getAnswerCount(questionId) {
      return { answerCount: await repository.countAnswers(questionId) };
    },
    async getOwnAnswer(questionId, userId) {
      const answer = await repository.getMine(questionId, userId);
      if (answer === null) return null;
      const { body, createdAt, excerpt, questionId: ownedQuestionId, updatedAt } = answer;
      return { body, createdAt, excerpt, questionId: ownedQuestionId, updatedAt };
    },
    async listRevealedExcerpts(questionId) {
      return repository.listExcerpts(questionId);
    },
    async getRevealedAnswerBody(questionId, answerId) {
      const body = await repository.getAnswerBody(questionId, answerId);
      return body === null ? null : { body, id: answerId };
    },
  };
  return repository;
}
