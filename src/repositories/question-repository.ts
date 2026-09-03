import { and, asc, count, desc, eq, gt, inArray, isNotNull, lte } from 'drizzle-orm';
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
export type CreateQuestionInput = CreateDraftInput & {
  questionId: string;
  intent: 'draft' | 'publish';
};
export type CreateQuestionResult =
  | { kind: 'created' | 'reused'; question: Question }
  | { kind: 'conflict' | 'creator-missing' | 'invalid' | 'unavailable' };
export type DeleteQuestionResult =
  { kind: 'deleted' } | { kind: 'missing' | 'conflict' | 'unavailable' };
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
export type OpenQuestionSummary = { question: Question; answerCount: number };
export type QuestionPageResult = { items: OpenQuestionSummary[]; totalItems: number };
export type AnswerCountView = { answerCount: number };
export type OwnAnswerView = Pick<
  Answer,
  'body' | 'createdAt' | 'excerpt' | 'questionId' | 'updatedAt'
>;
export type RevealedExcerptView = Pick<Answer, 'excerpt' | 'id'> & { isOwn: boolean };
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
  createQuestion(input: CreateQuestionInput, now: number): Promise<CreateQuestionResult>;
  deleteOwnedQuestion(
    questionId: string,
    creatorUserId: string,
    expectedUpdatedAt: number,
    now: number,
  ): Promise<DeleteQuestionResult>;
  updateDraft(input: UpdateDraftInput, now: number): Promise<UpdateDraftResult>;
  publish(
    questionId: string,
    creatorUserId: string,
    now: number,
    expectedUpdatedAt?: number,
  ): Promise<PublishResult>;
  listByCreator(creatorUserId: string): Promise<OwnedQuestionSummary[]>;
  listOpenQuestions(
    snapshotNow: number,
    limit?: number,
    offset?: number,
  ): Promise<OpenQuestionSummary[]>;
  listRevealedQuestions(
    snapshotNow: number,
    limit?: number,
    offset?: number,
  ): Promise<OpenQuestionSummary[]>;
  countOpenQuestions(snapshotNow: number): Promise<number>;
  countRevealedQuestions(snapshotNow: number): Promise<number>;
  listOwnAnsweredQuestionIds(questionIds: string[], userId: string): Promise<string[]>;
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
  listRevealedExcerpts(questionId: string, viewerUserId: string): Promise<RevealedExcerptView[]>;
  getRevealedAnswerBody(questionId: string, answerId: string): Promise<RevealedBodyView | null>;
}

export function createQuestionRepository(database: D1Database): QuestionRepository {
  const db = createDatabase(database);
  // Conditional mutations stay as prepared D1 statements because ORM read-then-write sequences
  // would weaken the existing publication, ownership, and deadline race guards.
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
    async createQuestion(input, now) {
      if (
        !isPublishableQuestion(input, now) ||
        validateQuestionSchedule(
          {
            publishedAt: input.intent === 'publish' ? now : null,
            closesAt: input.closesAt,
            revealsAt: input.revealsAt,
          },
          now,
        ) !== null
      )
        return { kind: 'invalid' };
      const question: Question = {
        id: input.questionId,
        creatorUserId: input.creatorUserId,
        body: input.body,
        language: input.language,
        publishedAt: input.intent === 'publish' ? now : null,
        closesAt: input.closesAt,
        revealsAt: input.revealsAt,
        createdAt: now,
        updatedAt: now,
      };
      try {
        await db.insert(questions).values(question);
        return { kind: 'created', question };
      } catch {
        const current = await repository.getQuestion(input.questionId);
        if (current !== null) {
          const same =
            current.creatorUserId === input.creatorUserId &&
            current.body === input.body &&
            current.language === input.language &&
            current.closesAt === input.closesAt &&
            current.revealsAt === input.revealsAt &&
            (current.publishedAt === null) === (input.intent === 'draft');
          return same ? { kind: 'reused', question: current } : { kind: 'conflict' };
        }
        const [creator] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, input.creatorUserId))
          .limit(1);
        return creator === undefined ? { kind: 'creator-missing' } : { kind: 'unavailable' };
      }
    },
    async deleteOwnedQuestion(questionId, creatorUserId, expectedUpdatedAt, now) {
      try {
        const [, deletion] = await database.batch([
          database
            .prepare(
              "INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, outcome, created_at) SELECT lower(hex(randomblob(16))), creator_user_id, 'QUESTION_DELETED', 'QUESTION', id, 'SUCCESS', ? FROM questions WHERE id = ? AND creator_user_id = ? AND updated_at = ?",
            )
            .bind(now, questionId, creatorUserId, expectedUpdatedAt),
          database
            .prepare(
              'DELETE FROM questions WHERE id = ? AND creator_user_id = ? AND updated_at = ?',
            )
            .bind(questionId, creatorUserId, expectedUpdatedAt),
        ]);
        if (deletion !== undefined && deletion.meta.changes > 0) return { kind: 'deleted' };
        const current = await repository.getOwnedQuestion(questionId, creatorUserId);
        return current === null ? { kind: 'missing' } : { kind: 'conflict' };
      } catch {
        return { kind: 'unavailable' };
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
            'UPDATE questions SET body = ?, closes_at = ?, reveals_at = ?, updated_at = ? WHERE id = ? AND creator_user_id = ? AND published_at IS NULL AND updated_at = ?',
          )
          .bind(
            input.body,
            input.closesAt,
            input.revealsAt,
            now,
            input.questionId,
            input.creatorUserId,
            input.expectedUpdatedAt,
          )
          .run();
        if (result.meta.changes > 0) {
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
        if (result.meta.changes > 0) {
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
    async listOpenQuestions(snapshotNow, limit, offset = 0) {
      const query = db
        .select({ question: questions, answerCount: count(answers.id) })
        .from(questions)
        .leftJoin(answers, eq(answers.questionId, questions.id))
        .where(
          and(
            isNotNull(questions.publishedAt),
            lte(questions.publishedAt, snapshotNow),
            gt(questions.closesAt, snapshotNow),
          ),
        )
        .groupBy(questions.id)
        .orderBy(asc(questions.closesAt), asc(questions.id));
      const rows = limit === undefined ? await query : await query.limit(limit).offset(offset);
      return rows.map(({ question, answerCount }) => ({ question, answerCount }));
    },
    async listRevealedQuestions(snapshotNow, limit, offset = 0) {
      const query = db
        .select({ question: questions, answerCount: count(answers.id) })
        .from(questions)
        .leftJoin(answers, eq(answers.questionId, questions.id))
        .where(and(isNotNull(questions.publishedAt), lte(questions.revealsAt, snapshotNow)))
        .groupBy(questions.id)
        .orderBy(desc(questions.revealsAt), asc(questions.id));
      const rows = limit === undefined ? await query : await query.limit(limit).offset(offset);
      return rows.map(({ question, answerCount }) => ({ question, answerCount }));
    },
    async countOpenQuestions(snapshotNow) {
      const [row] = await db
        .select({ value: count() })
        .from(questions)
        .where(
          and(
            isNotNull(questions.publishedAt),
            lte(questions.publishedAt, snapshotNow),
            gt(questions.closesAt, snapshotNow),
          ),
        );
      return row?.value ?? 0;
    },
    async countRevealedQuestions(snapshotNow) {
      const [row] = await db
        .select({ value: count() })
        .from(questions)
        .where(and(isNotNull(questions.publishedAt), lte(questions.revealsAt, snapshotNow)));
      return row?.value ?? 0;
    },
    async listOwnAnsweredQuestionIds(questionIds, userId) {
      if (questionIds.length === 0) return [];
      const rows = await db
        .select({ questionId: answers.questionId })
        .from(answers)
        .where(and(eq(answers.userId, userId), inArray(answers.questionId, questionIds)));
      return rows.map(({ questionId }) => questionId);
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
        if (result.meta.changes > 0) {
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
        if (result.meta.changes > 0) {
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
        const [, result] = await database.batch([
          database
            .prepare(
              "INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, outcome, created_at) SELECT lower(hex(randomblob(16))), a.user_id, 'ANSWER_REMOVED', 'ANSWER', a.id, 'SUCCESS', ? FROM answers a WHERE a.question_id = ? AND a.user_id = ? AND EXISTS (SELECT 1 FROM questions q WHERE q.id = a.question_id AND q.published_at IS NOT NULL AND q.published_at <= ? AND ? < q.closes_at)",
            )
            .bind(now, questionId, userId, now, now),
          database
            .prepare(
              'DELETE FROM answers WHERE question_id = ? AND user_id = ? AND EXISTS (SELECT 1 FROM questions q WHERE q.id = answers.question_id AND q.published_at IS NOT NULL AND q.published_at <= ? AND ? < q.closes_at)',
            )
            .bind(questionId, userId, now, now),
        ]);
        if (result !== undefined && result.meta.changes > 0) return { kind: 'removed' };
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
    async listRevealedExcerpts(questionId, viewerUserId) {
      const rows = await db
        .select({ excerpt: answers.excerpt, id: answers.id, userId: answers.userId })
        .from(answers)
        .where(eq(answers.questionId, questionId))
        .orderBy(asc(answers.createdAt), asc(answers.id));
      return rows.map(({ excerpt, id, userId }) => ({
        excerpt,
        id,
        isOwn: userId === viewerUserId,
      }));
    },
    async getRevealedAnswerBody(questionId, answerId) {
      const body = await repository.getAnswerBody(questionId, answerId);
      return body === null ? null : { body, id: answerId };
    },
  };
  return repository;
}
