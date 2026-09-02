import { env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { applyMigrations } from './apply-migrations';
import { insertUser, userFixture } from './fixtures';

describe('domain schema constraints', () => {
  beforeAll(async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS);
    await insertUser(env.TEST_DB, userFixture('creator'));
    await insertUser(env.TEST_DB, userFixture('answerer'));
  });

  it.each([
    ['', 'en', null, 2_000, 3_000],
    ['Question', '  ', null, 2_000, 3_000],
    ['Question', 'en', 2_000, 2_000, 3_000],
    ['Question', 'en', null, 3_001, 3_000],
  ])(
    'rejects invalid question values',
    async (body, language, publishedAt, closesAt, revealsAt) => {
      await expect(
        env.TEST_DB.prepare(
          'INSERT INTO questions (id, creator_user_id, body, language, published_at, closes_at, reveals_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
          .bind(
            crypto.randomUUID(),
            'creator',
            body,
            language,
            publishedAt,
            closesAt,
            revealsAt,
            1_000,
            1_000,
          )
          .run(),
      ).rejects.toThrow();
    },
  );

  it('enforces answer content, uniqueness, references, and deletion rules', async () => {
    await env.TEST_DB.prepare(
      'INSERT INTO questions (id, creator_user_id, body, language, published_at, closes_at, reveals_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind('question', 'creator', 'Question', 'en', 1_000, 2_000, 3_000, 1_000, 1_000)
      .run();
    const insertAnswer = (id: string, userId: string, body = 'Answer', excerpt = 'Excerpt') =>
      env.TEST_DB.prepare(
        'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
        .bind(id, 'question', userId, body, excerpt, 1_500)
        .run();

    await insertAnswer('answer', 'answerer');
    await expect(insertAnswer('duplicate', 'answerer')).rejects.toThrow();
    await expect(insertAnswer('empty', 'creator', '   ')).rejects.toThrow();
    await expect(insertAnswer('newline', 'creator', 'Answer', 'Line 1\nLine 2')).rejects.toThrow();
    await expect(
      env.TEST_DB.prepare('DELETE FROM user WHERE id = ?').bind('creator').run(),
    ).rejects.toThrow();
    await env.TEST_DB.prepare('DELETE FROM questions WHERE id = ?').bind('question').run();
    expect(
      await env.TEST_DB.prepare('SELECT COUNT(*) AS count FROM answers').first<{ count: number }>(),
    ).toEqual({ count: 0 });
  });
});
