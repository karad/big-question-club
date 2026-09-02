import { env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { applyMigrations } from './apply-migrations';
import { insertSession, insertUser, userFixture } from './fixtures';

describe('audit log triggers', () => {
  beforeAll(async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS);
    await insertUser(env.TEST_DB, userFixture('audit-user'));
  });

  it('records session, question, and answer writes without copying content', async () => {
    await insertSession(env.TEST_DB, {
      id: 'audit-session',
      userId: 'audit-user',
      token: 'PRIVATE_TOKEN_SENTINEL',
      createdAt: 10_000,
      expiresAt: 20_000,
    });
    await env.TEST_DB.prepare(
      'INSERT INTO questions (id, creator_user_id, body, language, published_at, closes_at, reveals_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        'audit-question',
        'audit-user',
        'PRIVATE_QUESTION_SENTINEL',
        'auto',
        null,
        50_000,
        50_000,
        11_000,
        11_000,
      )
      .run();
    await env.TEST_DB.prepare('UPDATE questions SET body = ?, updated_at = ? WHERE id = ?')
      .bind('PRIVATE_QUESTION_UPDATED_SENTINEL', 12_000, 'audit-question')
      .run();
    await env.TEST_DB.prepare('UPDATE questions SET published_at = ?, updated_at = ? WHERE id = ?')
      .bind(13_000, 13_000, 'audit-question')
      .run();
    await env.TEST_DB.prepare(
      'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        'audit-answer',
        'audit-question',
        'audit-user',
        'PRIVATE_ANSWER_SENTINEL',
        'PRIVATE_EXCERPT_SENTINEL',
        14_000,
        14_000,
      )
      .run();
    await env.TEST_DB.prepare('UPDATE answers SET body = ?, updated_at = ? WHERE id = ?')
      .bind('PRIVATE_ANSWER_UPDATED_SENTINEL', 15_000, 'audit-answer')
      .run();
    await env.TEST_DB.prepare('DELETE FROM session WHERE id = ?').bind('audit-session').run();

    const logs = await env.TEST_DB.prepare(
      "SELECT actor_user_id, action, target_type, target_id, outcome FROM audit_logs WHERE actor_user_id = 'audit-user' ORDER BY created_at, action",
    ).all();
    expect(logs.results).toEqual([
      {
        actor_user_id: 'audit-user',
        action: 'LOGIN',
        target_type: 'SESSION',
        target_id: 'audit-session',
        outcome: 'SUCCESS',
      },
      {
        actor_user_id: 'audit-user',
        action: 'QUESTION_CREATED',
        target_type: 'QUESTION',
        target_id: 'audit-question',
        outcome: 'SUCCESS',
      },
      {
        actor_user_id: 'audit-user',
        action: 'QUESTION_UPDATED',
        target_type: 'QUESTION',
        target_id: 'audit-question',
        outcome: 'SUCCESS',
      },
      {
        actor_user_id: 'audit-user',
        action: 'QUESTION_PUBLISHED',
        target_type: 'QUESTION',
        target_id: 'audit-question',
        outcome: 'SUCCESS',
      },
      {
        actor_user_id: 'audit-user',
        action: 'ANSWER_SUBMITTED',
        target_type: 'ANSWER',
        target_id: 'audit-answer',
        outcome: 'SUCCESS',
      },
      {
        actor_user_id: 'audit-user',
        action: 'ANSWER_UPDATED',
        target_type: 'ANSWER',
        target_id: 'audit-answer',
        outcome: 'SUCCESS',
      },
      {
        actor_user_id: 'audit-user',
        action: 'LOGOUT',
        target_type: 'SESSION',
        target_id: 'audit-session',
        outcome: 'SUCCESS',
      },
    ]);
    expect(JSON.stringify(logs.results)).not.toMatch(
      /PRIVATE_(TOKEN|QUESTION|ANSWER|EXCERPT)_SENTINEL/,
    );
  });
});
