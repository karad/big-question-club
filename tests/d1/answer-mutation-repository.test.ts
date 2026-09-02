import { env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { createQuestionRepository } from '../../src/repositories/question-repository';
import { applyMigrations } from './apply-migrations';
import { insertUser, userFixture } from './fixtures';

describe('D1 Answer mutation concurrency', () => {
  const repository = createQuestionRepository(env.TEST_DB);
  const deadline = 10_000;
  beforeAll(async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS);
    for (const id of ['creator', 'user-1', 'user-2'])
      await insertUser(env.TEST_DB, userFixture(id));
    const draft = await repository.createDraft(
      {
        creatorUserId: 'creator',
        body: 'Which answer remains under concurrent changes?',
        language: 'en',
        closesAt: deadline,
        revealsAt: deadline,
      },
      deadline - 2 * 60 * 60 * 1000,
    );
    if (draft.kind !== 'created') throw new Error('fixture question was not created');
    await env.TEST_DB.prepare('UPDATE questions SET published_at = ? WHERE id = ?')
      .bind(1, draft.question.id)
      .run();
    await env.TEST_DB.prepare('UPDATE questions SET id = ? WHERE id = ?')
      .bind('question', draft.question.id)
      .run();
  });

  it('never changes another user answer and freezes all writes at the deadline', async () => {
    await repository.submit('question', 'user-2', { answer: 'Other', excerpt: 'Other' }, 2);
    expect(
      await repository.updateAnswer(
        'question',
        'user-1',
        { answer: 'Intrusion', excerpt: 'Intrusion' },
        3,
      ),
    ).toEqual({ kind: 'answer-missing' });
    expect(await repository.removeAnswer('question', 'user-1', 3)).toEqual({
      kind: 'answer-missing',
    });
    expect(await repository.getMine('question', 'user-2')).toMatchObject({ body: 'Other' });
    expect(await repository.removeAnswer('question', 'user-2', deadline)).toEqual({
      kind: 'not-open',
    });
  });

  it('keeps deletion final against ten delayed updates', async () => {
    await repository.submit('question', 'user-1', { answer: 'Initial', excerpt: 'Initial' }, 4);
    const results = await Promise.all([
      repository.removeAnswer('question', 'user-1', 5),
      ...Array.from({ length: 10 }, (_, index) =>
        repository.updateAnswer(
          'question',
          'user-1',
          { answer: `Update ${index}`, excerpt: `Update ${index}` },
          6 + index,
        ),
      ),
    ]);
    expect(results.some(({ kind }) => kind === 'removed')).toBe(true);
    expect(await repository.getMine('question', 'user-1')).toBeNull();
    expect(
      await env.TEST_DB.prepare(
        "SELECT actor_user_id AS actorUserId, action, target_type AS targetType, outcome FROM audit_logs WHERE action = 'ANSWER_REMOVED' ORDER BY created_at DESC LIMIT 1",
      ).first(),
    ).toEqual({
      actorUserId: 'user-1',
      action: 'ANSWER_REMOVED',
      targetType: 'ANSWER',
      outcome: 'SUCCESS',
    });
  });

  it('keeps at most one answer when delete and ten resubmissions race', async () => {
    await repository.submit('question', 'user-1', { answer: 'Before', excerpt: 'Before' }, 20);
    await Promise.all([
      repository.removeAnswer('question', 'user-1', 21),
      ...Array.from({ length: 10 }, (_, index) =>
        repository.submit(
          'question',
          'user-1',
          { answer: `New ${index}`, excerpt: `New ${index}` },
          22 + index,
        ),
      ),
    ]);
    expect(await repository.countAnswers('question')).toBeLessThanOrEqual(2);
    expect(
      await env.TEST_DB.prepare(
        'SELECT COUNT(*) AS count FROM answers WHERE question_id = ? AND user_id = ?',
      )
        .bind('question', 'user-1')
        .first(),
    ).toEqual({ count: 1 });
  });
});
