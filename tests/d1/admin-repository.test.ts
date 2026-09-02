import { env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { createAdminRepository } from '../../src/repositories/admin-repository';
import { applyMigrations } from './apply-migrations';
import { insertSession, insertUser, sessionFixture, userFixture } from './fixtures';

describe('D1 admin repository', () => {
  beforeAll(async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS);
    await insertUser(env.TEST_DB, { ...userFixture('admin-user'), email: 'admin@example.com' });
    await insertUser(env.TEST_DB, userFixture('managed-user'));
    await insertUser(env.TEST_DB, userFixture('second-user'));
  });

  it('authorizes only the user whose persisted email matches configuration', async () => {
    const repository = createAdminRepository(env.TEST_DB, 'admin@example.com');
    await expect(repository.isAdmin('admin-user')).resolves.toBe(true);
    await expect(repository.isAdmin('managed-user')).resolves.toBe(false);
    await expect(repository.isAdmin('missing-user')).resolves.toBe(false);
    await expect(createAdminRepository(env.TEST_DB, null).isAdmin('admin-user')).resolves.toBe(
      false,
    );
  });

  it('lists users, questions, answers, and audit events for moderation', async () => {
    await env.TEST_DB.prepare(
      'INSERT INTO questions (id, creator_user_id, body, language, published_at, closes_at, reveals_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        'admin-list-question',
        'managed-user',
        '<script>unsafe question</script>',
        'auto',
        2_000,
        9_000,
        9_000,
        2_000,
        2_000,
      )
      .run();
    await env.TEST_DB.prepare(
      'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        'admin-list-answer',
        'admin-list-question',
        'second-user',
        '<script>unsafe answer</script>',
        'Unsafe excerpt',
        3_000,
        3_000,
      )
      .run();

    const dashboard = await createAdminRepository(env.TEST_DB, 'admin@example.com').getDashboard();
    expect(dashboard.users.find(({ id }) => id === 'managed-user')).toMatchObject({
      email: 'managed-user@example.test',
      bannedAt: null,
    });
    expect(dashboard.questions.find(({ id }) => id === 'admin-list-question')).toMatchObject({
      creatorUserId: 'managed-user',
      body: '<script>unsafe question</script>',
    });
    expect(dashboard.answers.find(({ id }) => id === 'admin-list-answer')).toMatchObject({
      userId: 'second-user',
      body: '<script>unsafe answer</script>',
    });
    expect(dashboard.auditLogs[0]?.createdAt).toBeGreaterThanOrEqual(
      dashboard.auditLogs.at(-1)?.createdAt ?? 0,
    );
  });

  it('deletes one answer while preserving its question and sibling answer', async () => {
    await seedQuestionWithAnswers('delete-answer-question');
    const repository = createAdminRepository(env.TEST_DB, 'admin@example.com');
    await expect(repository.deleteAnswer('delete-answer-a', 'admin-user', 20_000)).resolves.toBe(
      'deleted',
    );
    await expect(repository.deleteAnswer('missing-answer', 'admin-user', 20_001)).resolves.toBe(
      'missing',
    );

    expect(await rowCount('answers', "id = 'delete-answer-a'")).toBe(0);
    expect(await rowCount('answers', "id = 'delete-answer-b'")).toBe(1);
    expect(await rowCount('questions', "id = 'delete-answer-question'")).toBe(1);
    await expectAudit('ADMIN_ANSWER_DELETED', 'delete-answer-a', 'admin-user');
  });

  it('deletes a question with its answers while retaining the audit event', async () => {
    await seedQuestionWithAnswers('delete-question');
    const repository = createAdminRepository(env.TEST_DB, 'admin@example.com');
    await expect(repository.deleteQuestion('delete-question', 'admin-user', 21_000)).resolves.toBe(
      'deleted',
    );
    await expect(repository.deleteQuestion('missing-question', 'admin-user', 21_001)).resolves.toBe(
      'missing',
    );

    expect(await rowCount('questions', "id = 'delete-question'")).toBe(0);
    expect(await rowCount('answers', "question_id = 'delete-question'")).toBe(0);
    await expectAudit('ADMIN_QUESTION_DELETED', 'delete-question', 'admin-user');
  });

  it('bans a user, invalidates all sessions, rejects self-ban, and supports unban', async () => {
    await insertSession(env.TEST_DB, sessionFixture('managed-user'));
    await insertSession(env.TEST_DB, {
      ...sessionFixture('managed-user'),
      id: 'session-managed-user-2',
      token: 'token-managed-user-2',
    });
    const repository = createAdminRepository(env.TEST_DB, 'admin@example.com');

    await expect(repository.banUser('managed-user', 'admin-user', 30_000)).resolves.toBe('banned');
    await expect(repository.banUser('admin-user', 'admin-user', 30_001)).resolves.toBe(
      'self-forbidden',
    );
    expect(await rowCount('session', "userId = 'managed-user'")).toBe(0);
    await expect(repository.isUserBanned('managed-user')).resolves.toBe(true);
    await expectAudit('USER_BANNED', 'managed-user', 'admin-user');

    await expect(repository.unbanUser('managed-user', 'admin-user', 31_000)).resolves.toBe(
      'unbanned',
    );
    await expect(repository.isUserBanned('managed-user')).resolves.toBe(false);
    await expectAudit('USER_UNBANNED', 'managed-user', 'admin-user');
  });

  async function seedQuestionWithAnswers(questionId: string): Promise<void> {
    await env.TEST_DB.prepare(
      'INSERT INTO questions (id, creator_user_id, body, language, published_at, closes_at, reveals_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        questionId,
        'managed-user',
        `Question ${questionId}`,
        'auto',
        1_000,
        9_000,
        9_000,
        1_000,
        1_000,
      )
      .run();
    for (const [id, userId] of [
      [
        `${questionId === 'delete-answer-question' ? 'delete-answer' : questionId}-a`,
        'managed-user',
      ],
      [
        `${questionId === 'delete-answer-question' ? 'delete-answer' : questionId}-b`,
        'second-user',
      ],
    ]) {
      await env.TEST_DB.prepare(
        'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(id, questionId, userId, `Body ${id}`, `Excerpt ${id}`, 2_000, 2_000)
        .run();
    }
  }

  async function rowCount(table: string, condition: string): Promise<number> {
    const result = await env.TEST_DB.prepare(
      `SELECT COUNT(*) AS count FROM ${table} WHERE ${condition}`,
    ).first<{ count: number }>();
    return result?.count ?? 0;
  }

  async function expectAudit(action: string, targetId: string, actorUserId: string): Promise<void> {
    const row = await env.TEST_DB.prepare(
      'SELECT actor_user_id, action, target_id FROM audit_logs WHERE action = ? AND target_id = ?',
    )
      .bind(action, targetId)
      .first();
    expect(row).toEqual({ actor_user_id: actorUserId, action, target_id: targetId });
  }
});
