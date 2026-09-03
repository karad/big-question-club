import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { createQuestionRepository } from '../../src/repositories/question-repository';
import { applyMigrations } from './apply-migrations';
import { insertUser, userFixture } from './fixtures';

const now = 1_000_000;
const hour = 60 * 60 * 1000;
const deadline = now + 2 * hour;

describe('Question management repository', () => {
  beforeEach(async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS);
    await env.TEST_DB.batch([
      env.TEST_DB.prepare('DELETE FROM answers'),
      env.TEST_DB.prepare('DELETE FROM questions'),
      env.TEST_DB.prepare('DELETE FROM session'),
      env.TEST_DB.prepare('DELETE FROM account'),
      env.TEST_DB.prepare('DELETE FROM user'),
    ]);
    await insertUser(env.TEST_DB, userFixture('creator-1'));
    await insertUser(env.TEST_DB, userFixture('creator-2'));
    await insertUser(env.TEST_DB, userFixture('answerer'));
  });

  async function createDraft(overrides: Record<string, unknown> = {}) {
    const repository = createQuestionRepository(env.TEST_DB);
    const result = await repository.createDraft(
      {
        creatorUserId: 'creator-1',
        body: 'What should humanity improve?',
        language: 'en',
        closesAt: deadline,
        revealsAt: deadline,
        ...overrides,
      } as never,
      now,
    );
    if (result.kind !== 'created') throw new Error(`Draft creation failed: ${result.kind}`);
    return { repository, question: result.question };
  }

  it('creates a valid owned draft with server timestamps and immediate reveal deadline', async () => {
    const { repository, question } = await createDraft();
    expect(question).toMatchObject({
      creatorUserId: 'creator-1',
      publishedAt: null,
      closesAt: deadline,
      revealsAt: deadline,
      createdAt: now,
      updatedAt: now,
    });
    expect(question.id).not.toBe('');
    expect(await repository.getOwnedQuestion(question.id, 'creator-1')).toEqual(question);
  });

  it('creates draft or published questions idempotently with a client creation token', async () => {
    const repository = createQuestionRepository(env.TEST_DB);
    const input = {
      questionId: '00000000-0000-4000-8000-000000000001',
      creatorUserId: 'creator-1',
      body: 'What should humanity improve?',
      language: 'auto',
      closesAt: deadline,
      revealsAt: deadline,
      intent: 'publish' as const,
    };
    expect((await repository.createQuestion(input, now)).kind).toBe('created');
    expect((await repository.createQuestion(input, now + 1)).kind).toBe('reused');
    expect(
      (await repository.createQuestion({ ...input, body: 'How should humanity improve?' }, now + 1))
        .kind,
    ).toBe('conflict');
    expect((await repository.getQuestion(input.questionId))?.publishedAt).toBe(now);
  });

  it('deletes only the matching owner revision with answers and a content-free audit record', async () => {
    const { repository, question } = await createDraft();
    await env.TEST_DB.prepare(
      'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        'delete-answer',
        question.id,
        'answerer',
        'PRIVATE_DELETE_BODY',
        'PRIVATE_DELETE_EXCERPT',
        now,
        now,
      )
      .run();
    expect(
      await repository.deleteOwnedQuestion(question.id, 'creator-2', question.updatedAt, now + 1),
    ).toEqual({ kind: 'missing' });
    expect(
      await repository.deleteOwnedQuestion(
        question.id,
        'creator-1',
        question.updatedAt + 1,
        now + 1,
      ),
    ).toEqual({ kind: 'conflict' });
    expect(
      await repository.deleteOwnedQuestion(question.id, 'creator-1', question.updatedAt, now + 1),
    ).toEqual({ kind: 'deleted' });
    expect(await repository.getQuestion(question.id)).toBeNull();
    const deletedAnswer = await env.TEST_DB.prepare('SELECT id FROM answers WHERE question_id = ?')
      .bind(question.id)
      .first();
    expect(deletedAnswer).toBeNull();
    const audit = await env.TEST_DB.prepare(
      "SELECT action, actor_user_id, target_id FROM audit_logs WHERE action = 'QUESTION_DELETED'",
    ).first<Record<string, unknown>>();
    expect(audit).toMatchObject({
      action: 'QUESTION_DELETED',
      actor_user_id: 'creator-1',
      target_id: question.id,
    });
    expect(JSON.stringify(audit)).not.toContain('PRIVATE_DELETE');
  });

  it.each([
    ['short body', { body: 'short' }],
    ['deadline too soon', { closesAt: now + hour - 1, revealsAt: now + hour - 1 }],
    ['deadline too late', { closesAt: now + 31 * 24 * hour, revealsAt: now + 31 * 24 * hour }],
    ['different reveal', { revealsAt: deadline + 1 }],
  ])('does not persist %s', async (_label, overrides) => {
    const repository = createQuestionRepository(env.TEST_DB);
    const result = await repository.createDraft(
      {
        creatorUserId: 'creator-1',
        body: 'What should humanity improve?',
        language: 'en',
        closesAt: deadline,
        revealsAt: deadline,
        ...overrides,
      } as never,
      now,
    );
    expect(result).toEqual({ kind: 'invalid' });
    expect(await repository.listByCreator('creator-1')).toEqual([]);
  });

  it('classifies a missing creator without persisting the draft', async () => {
    const repository = createQuestionRepository(env.TEST_DB);
    const result = await repository.createDraft(
      {
        creatorUserId: 'missing',
        body: 'What should humanity improve?',
        language: 'en',
        closesAt: deadline,
        revealsAt: deadline,
      },
      now,
    );
    expect(result).toEqual({ kind: 'creator-missing' });
  });

  it('returns an owned question without exposing it to another owner', async () => {
    const { repository, question } = await createDraft();
    expect(await repository.getOwnedQuestion(question.id, 'creator-1')).toEqual(question);
    expect(await repository.getOwnedQuestion(question.id, 'creator-2')).toBeNull();
    expect(await repository.getOwnedQuestion('missing', 'creator-1')).toBeNull();
  });

  it('updates only a matching owned draft revision', async () => {
    const { repository, question } = await createDraft();
    const updated = await repository.updateDraft(
      {
        questionId: question.id,
        creatorUserId: 'creator-1',
        expectedUpdatedAt: now,
        body: 'How can humanity improve sleep?',
        language: 'en',
        closesAt: deadline + hour,
        revealsAt: deadline + hour,
      },
      now + 1,
    );
    expect(updated).toMatchObject({
      kind: 'updated',
      question: { body: 'How can humanity improve sleep?' },
    });
    expect(
      await repository.updateDraft(
        {
          questionId: question.id,
          creatorUserId: 'creator-1',
          expectedUpdatedAt: now,
          body: 'Stale overwrite attempt',
          language: 'en',
          closesAt: deadline,
          revealsAt: deadline,
        },
        now + 2,
      ),
    ).toEqual({ kind: 'conflict' });
    expect((await repository.getQuestion(question.id))?.body).toBe(
      'How can humanity improve sleep?',
    );
  });

  it('does not update a draft owned by another user', async () => {
    const { repository, question } = await createDraft();
    const before = await repository.getQuestion(question.id);
    expect(
      await repository.updateDraft(
        {
          questionId: question.id,
          creatorUserId: 'creator-2',
          expectedUpdatedAt: now,
          body: 'Unauthorized change',
          language: 'ja',
          closesAt: deadline,
          revealsAt: deadline,
        },
        now + 1,
      ),
    ).toEqual({ kind: 'unavailable-to-owner' });
    expect(await repository.getQuestion(question.id)).toEqual(before);
  });

  it('publishes a draft once across sequential and concurrent attempts', async () => {
    const { repository, question } = await createDraft();
    const concurrent = await Promise.all(
      Array.from({ length: 10 }, () => repository.publish(question.id, 'creator-1', now + 1, now)),
    );
    expect(concurrent.filter(({ kind }) => kind === 'published')).toHaveLength(1);
    expect(concurrent.filter(({ kind }) => kind === 'invalid-transition')).toHaveLength(9);
    const sequential = [];
    for (let index = 0; index < 10; index += 1) {
      sequential.push(await repository.publish(question.id, 'creator-1', now + 2 + index));
    }
    expect(sequential.every(({ kind }) => kind === 'invalid-transition')).toBe(true);
    expect((await repository.getQuestion(question.id))?.publishedAt).toBe(now + 1);
  });

  it('rejects publication at deadline boundaries outside the managed range', async () => {
    const tooSoon = await createDraft({ closesAt: now + hour, revealsAt: now + hour });
    expect(
      await tooSoon.repository.publish(tooSoon.question.id, 'creator-1', now + 1, now),
    ).toEqual({ kind: 'invalid-transition' });
  });

  it('rejects publication when the reveal time differs from the deadline', async () => {
    const { repository, question } = await createDraft();
    await env.TEST_DB.prepare('UPDATE questions SET reveals_at = ? WHERE id = ?')
      .bind(deadline + hour, question.id)
      .run();

    expect(await repository.publish(question.id, 'creator-1', now + 1, now)).toEqual({
      kind: 'invalid-transition',
    });
    expect((await repository.getQuestion(question.id))?.publishedAt).toBeNull();
  });

  it('does not change a published question through draft update', async () => {
    const { repository, question } = await createDraft();
    await repository.publish(question.id, 'creator-1', now + 1, now);
    const before = await repository.getQuestion(question.id);
    expect(
      await repository.updateDraft(
        {
          questionId: question.id,
          creatorUserId: 'creator-1',
          expectedUpdatedAt: now + 1,
          body: 'Published overwrite attempt',
          language: 'ja',
          closesAt: deadline,
          revealsAt: deadline,
        },
        now + 2,
      ),
    ).toEqual({ kind: 'already-published' });
    expect(await repository.getQuestion(question.id)).toEqual(before);
  });

  it('lists owned questions in stable newest-first order with answer counts only', async () => {
    const first = await createDraft();
    const second = await first.repository.createDraft(
      {
        creatorUserId: 'creator-1',
        body: 'How should cities improve mobility?',
        language: 'en',
        closesAt: deadline,
        revealsAt: deadline,
      },
      now + 1,
    );
    if (second.kind !== 'created') throw new Error('Second draft was not created');
    await env.TEST_DB.prepare(
      'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        'answer-1',
        second.question.id,
        'answerer',
        'Private answer body',
        'Private excerpt',
        now + 2,
        now + 2,
      )
      .run();
    await first.repository.createDraft(
      {
        creatorUserId: 'creator-2',
        body: 'Other owner private question',
        language: 'en',
        closesAt: deadline,
        revealsAt: deadline,
      },
      now + 2,
    );

    const listed = await first.repository.listByCreator('creator-1');
    expect(listed.map(({ question }) => question.id)).toEqual([
      second.question.id,
      first.question.id,
    ]);
    expect(listed.map(({ answerCount }) => answerCount)).toEqual([1, 0]);
    expect(JSON.stringify(listed)).not.toContain('Private answer body');
    expect(JSON.stringify(listed)).not.toContain('Private excerpt');
    expect(JSON.stringify(listed)).not.toContain('Other owner private question');
  });
});
