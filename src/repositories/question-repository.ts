import type { Answer, Question } from '../domain/question';
import type { SubmissionInput } from '../domain/answer-submission';

export type SubmitResult =
  | { kind: 'submitted'; answer: Answer }
  | { kind: 'duplicate' }
  | { kind: 'missing' }
  | { kind: 'unavailable' };
export interface QuestionRepository {
  getQuestion(id: string): Promise<Question | null>;
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

export function createQuestionRepository(db: D1Database): QuestionRepository {
  return {
    async getQuestion(id) {
      return (
        (await db
          .prepare(
            'SELECT id, body, closes_at AS closesAt, created_at AS createdAt FROM questions WHERE id = ?',
          )
          .bind(id)
          .first<Question>()) ?? null
      );
    },
    async submit(questionId, userId, input, now) {
      const question = await this.getQuestion(questionId);
      if (question === null) return { kind: 'missing' };
      const id = crypto.randomUUID();
      try {
        await db
          .prepare(
            'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          )
          .bind(id, questionId, userId, input.answer, input.excerpt, now)
          .run();
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
      } catch {
        return (await this.getMine(questionId, userId)) === null
          ? { kind: 'unavailable' }
          : { kind: 'duplicate' };
      }
    },
    async getMine(questionId, userId) {
      return (
        (await db
          .prepare(
            'SELECT id, question_id AS questionId, user_id AS userId, body, excerpt, created_at AS createdAt FROM answers WHERE question_id = ? AND user_id = ?',
          )
          .bind(questionId, userId)
          .first<Answer>()) ?? null
      );
    },
    async countAnswers(questionId) {
      return (
        (
          await db
            .prepare('SELECT COUNT(*) AS count FROM answers WHERE question_id = ?')
            .bind(questionId)
            .first<{ count: number }>()
        )?.count ?? 0
      );
    },
    async listExcerpts(questionId) {
      return (
        await db
          .prepare('SELECT id, excerpt FROM answers WHERE question_id = ? ORDER BY created_at')
          .bind(questionId)
          .all<Pick<Answer, 'id' | 'excerpt'>>()
      ).results;
    },
    async getAnswerBody(questionId, answerId) {
      return (
        (
          await db
            .prepare('SELECT body FROM answers WHERE question_id = ? AND id = ?')
            .bind(questionId, answerId)
            .first<{ body: string }>()
        )?.body ?? null
      );
    },
  };
}
