import { and, asc, count, eq } from 'drizzle-orm';
import { parseSubmissionInput, type SubmissionInput } from '../domain/answer-submission';
import type { Answer, Question } from '../domain/question';
import { validateQuestionSchedule } from '../domain/question-lifecycle';
import { createDatabase } from '../db/client';
import { answers, questions, users } from '../db/schema';

export type CreateDraftInput = Omit<Question, 'publishedAt' | 'createdAt' | 'updatedAt'>;
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
export type SubmitResult =
  | { kind: 'submitted'; answer: Answer }
  | { kind: 'duplicate' }
  | { kind: 'missing' }
  | { kind: 'not-open' }
  | { kind: 'reference-missing' }
  | { kind: 'invalid' }
  | { kind: 'unavailable' };

export interface QuestionRepository {
  getQuestion(id: string): Promise<Question | null>;
  createDraft(input: CreateDraftInput, now: number): Promise<CreateDraftResult>;
  publish(questionId: string, creatorUserId: string, now: number): Promise<PublishResult>;
  submit(
    questionId: string,
    userId: string,
    input: SubmissionInput,
    now: number,
  ): Promise<SubmitResult>;
  getMine(questionId: string, userId: string): Promise<Answer | null>;
  countAnswers(questionId: string): Promise<number>;
  listExcerpts(questionId: string): Promise<Array<Pick<Answer, 'id' | 'excerpt'>>>;
  getAnswerBody(questionId: string, answerId: string): Promise<string | null>;
}

export function createQuestionRepository(database: D1Database): QuestionRepository {
  const db = createDatabase(database);
  const repository: QuestionRepository = {
    async getQuestion(id) {
      const [question] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
      return question ?? null;
    },
    async createDraft(input, now) {
      if (
        !input.body.trim() ||
        !input.language.trim() ||
        validateQuestionSchedule(
          { publishedAt: null, closesAt: input.closesAt, revealsAt: input.revealsAt },
          now,
        ) !== null
      ) {
        return { kind: 'invalid' };
      }
      const question: Question = { ...input, publishedAt: null, createdAt: now, updatedAt: now };
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
    async publish(questionId, creatorUserId, now) {
      try {
        const result = await database
          .prepare(
            'UPDATE questions SET published_at = ?, updated_at = ? WHERE id = ? AND creator_user_id = ? AND published_at IS NULL AND ? < closes_at AND closes_at <= reveals_at',
          )
          .bind(now, now, questionId, creatorUserId, now)
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
    async submit(questionId, userId, input, now) {
      const id = crypto.randomUUID();
      try {
        const result = await database
          .prepare(
            'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at) SELECT ?, q.id, ?, ?, ?, ? FROM questions q WHERE q.id = ? AND q.published_at IS NOT NULL AND q.published_at <= ? AND ? < q.closes_at',
          )
          .bind(id, userId, input.answer, input.excerpt, now, questionId, now, now)
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
            },
          };
        }
        return (await repository.getQuestion(questionId)) === null
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
        .orderBy(asc(answers.createdAt));
    },
    async getAnswerBody(questionId, answerId) {
      const [answer] = await db
        .select({ body: answers.body })
        .from(answers)
        .where(and(eq(answers.questionId, questionId), eq(answers.id, answerId)))
        .limit(1);
      return answer?.body ?? null;
    },
  };
  return repository;
}
