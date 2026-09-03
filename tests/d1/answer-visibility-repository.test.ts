import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { createQuestionRepository } from '../../src/repositories/question-repository';
import { applyMigrations } from './apply-migrations';
import { insertUser, userFixture } from './fixtures';

describe('D1 answer visibility projections', () => {
  beforeEach(async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS);
    await env.TEST_DB.batch([
      env.TEST_DB.prepare('DELETE FROM answers'),
      env.TEST_DB.prepare('DELETE FROM questions'),
      env.TEST_DB.prepare('DELETE FROM session'),
      env.TEST_DB.prepare('DELETE FROM account'),
      env.TEST_DB.prepare('DELETE FROM user'),
    ]);
    await insertUser(env.TEST_DB, userFixture('creator'));
    await insertUser(env.TEST_DB, userFixture('user-1'));
    await insertUser(env.TEST_DB, userFixture('user-2'));
    for (const [id, body] of [
      ['question-1', 'Which first question should remain isolated?'],
      ['question-2', 'Which second question should remain isolated?'],
    ]) {
      await env.TEST_DB.prepare(
        'INSERT INTO questions (id, creator_user_id, body, language, published_at, closes_at, reveals_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(id, 'creator', body, 'en', 1, 100, 200, 1, 1)
        .run();
    }
    for (const answer of [
      ['answer-b', 'question-1', 'user-2', 'Second body', 'Second excerpt', 20],
      ['answer-a', 'question-1', 'user-1', 'First body', 'First excerpt', 10],
      ['answer-other', 'question-2', 'user-2', 'Other body', 'Other excerpt', 5],
    ] as const) {
      await env.TEST_DB.prepare(
        'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(...answer, answer[5])
        .run();
    }
  });

  it('projects only the count and caller-owned answer for one question', async () => {
    const repository = createQuestionRepository(env.TEST_DB);
    expect(await repository.getAnswerCount('question-1')).toEqual({ answerCount: 2 });
    expect(await repository.getOwnAnswer('question-1', 'user-1')).toEqual({
      questionId: 'question-1',
      body: 'First body',
      excerpt: 'First excerpt',
      createdAt: 10,
      updatedAt: 10,
    });
    expect(await repository.getOwnAnswer('question-1', 'creator')).toBeNull();
  });

  it('orders excerpt projections and keeps body lookup inside the requested question', async () => {
    const repository = createQuestionRepository(env.TEST_DB);
    expect(await repository.listRevealedExcerpts('question-1', 'user-1')).toEqual([
      { id: 'answer-a', excerpt: 'First excerpt', isOwn: true },
      { id: 'answer-b', excerpt: 'Second excerpt', isOwn: false },
    ]);
    expect(await repository.getRevealedAnswerBody('question-1', 'answer-b')).toEqual({
      id: 'answer-b',
      body: 'Second body',
    });
    expect(await repository.getRevealedAnswerBody('question-1', 'answer-other')).toBeNull();
  });
});
