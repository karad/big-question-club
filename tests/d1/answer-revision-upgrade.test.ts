import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { applyMigrations } from './apply-migrations';
import { insertUser, userFixture } from './fixtures';

describe('SPEC 007 answer revision upgrade', () => {
  it('preserves existing answers and initializes updated_at from created_at', async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS, { through: 4 });
    await insertUser(env.TEST_DB, userFixture('creator-007'));
    await insertUser(env.TEST_DB, userFixture('answerer-007'));
    await env.TEST_DB.prepare(
      'INSERT INTO questions (id, creator_user_id, body, language, published_at, closes_at, reveals_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind('question-007', 'creator-007', 'Preserved question', 'en', 1, 10, 10, 1, 1)
      .run();
    await env.TEST_DB.prepare(
      'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind('answer-007', 'question-007', 'answerer-007', 'Preserved answer', 'Preserved', 5)
      .run();

    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS, { from: 5, through: 5 });

    expect(
      await env.TEST_DB.prepare('SELECT id, body, created_at, updated_at FROM answers WHERE id = ?')
        .bind('answer-007')
        .first(),
    ).toEqual({ id: 'answer-007', body: 'Preserved answer', created_at: 5, updated_at: 5 });
  });
});
