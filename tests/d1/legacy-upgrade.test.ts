import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { applyMigrations } from './apply-migrations';
import { insertSession, insertUser, sessionFixture, userFixture } from './fixtures';

describe('SPEC 004 database upgrade', () => {
  it('keeps authentication data and replaces validation domain data', async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS, { through: 3 });
    await insertUser(env.TEST_DB, userFixture('legacy-user'));
    await insertSession(env.TEST_DB, sessionFixture('legacy-user'));
    await env.TEST_DB.prepare(
      'INSERT INTO questions (id, body, closes_at, created_at) VALUES (?, ?, ?, ?)',
    )
      .bind('spec-004-validation', 'Validation question', 0, 1_000)
      .run();
    await env.TEST_DB.prepare(
      'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind('legacy-answer', 'spec-004-validation', 'legacy-user', 'Answer', 'Excerpt', 1_000)
      .run();

    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS, { from: 4, through: 4 });

    expect(await env.TEST_DB.prepare('SELECT id FROM user').first()).toEqual({ id: 'legacy-user' });
    expect(await env.TEST_DB.prepare('SELECT id FROM session').first()).toEqual({
      id: 'session-legacy-user',
    });
    expect(await env.TEST_DB.prepare('SELECT COUNT(*) AS count FROM questions').first()).toEqual({
      count: 0,
    });
    expect(await env.TEST_DB.prepare('SELECT COUNT(*) AS count FROM answers').first()).toEqual({
      count: 0,
    });
  });
});
