import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { createQuestionRepository } from '../../src/repositories/question-repository';
import { applyMigrations } from './apply-migrations';
import { insertUser, userFixture } from './fixtures';

describe('question write guards', () => {
  const hour = 60 * 60 * 1000;
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
    await insertUser(env.TEST_DB, userFixture('answerer'));
  });

  async function draft(closesAt = 3 * hour, revealsAt = 3 * hour) {
    const repository = createQuestionRepository(env.TEST_DB);
    const created = await repository.createDraft(
      {
        creatorUserId: 'creator',
        body: 'Question body',
        language: 'en',
        closesAt,
        revealsAt,
      },
      0,
    );
    if (created.kind !== 'created') throw new Error('Question was not created');
    return { repository, questionId: created.question.id };
  }

  it('publishes only once for the creator before close', async () => {
    const { repository, questionId } = await draft();
    expect(await repository.publish(questionId, 'answerer', hour)).toEqual({
      kind: 'creator-mismatch',
    });
    expect(await repository.publish(questionId, 'creator', hour)).toMatchObject({
      kind: 'published',
    });
    expect(await repository.publish(questionId, 'creator', hour + 1)).toEqual({
      kind: 'invalid-transition',
    });
  });

  it.each([
    ['draft', null, 2 * hour, 'not-open'],
    ['at close', hour, 3 * hour, 'not-open'],
    ['after close', hour, 3 * hour + 1, 'not-open'],
    ['revealed', hour, 4 * hour, 'not-open'],
  ] as const)('rejects submission when %s', async (_label, publishedAt, now, expected) => {
    const { repository, questionId } = await draft();
    if (publishedAt !== null) await repository.publish(questionId, 'creator', publishedAt);
    expect(
      await repository.submit(
        questionId,
        'answerer',
        { answer: 'Answer', excerpt: 'Excerpt' },
        now,
      ),
    ).toEqual({ kind: expected });
  });

  it('keeps one answer across sequential and concurrent duplicate attempts', async () => {
    const { repository, questionId } = await draft();
    await repository.publish(questionId, 'creator', hour);
    const sequential = [];
    for (let index = 0; index < 10; index += 1) {
      sequential.push(
        await repository.submit(
          questionId,
          'answerer',
          { answer: `Answer ${index}`, excerpt: `Excerpt ${index}` },
          2 * hour,
        ),
      );
    }
    expect(sequential.filter(({ kind }) => kind === 'submitted')).toHaveLength(1);
    expect(sequential.filter(({ kind }) => kind === 'duplicate')).toHaveLength(9);

    await insertUser(env.TEST_DB, userFixture('concurrent'));
    const concurrent = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        repository.submit(
          questionId,
          'concurrent',
          { answer: `Concurrent ${index}`, excerpt: `Concurrent ${index}` },
          2 * hour + 100,
        ),
      ),
    );
    expect(concurrent.filter(({ kind }) => kind === 'submitted')).toHaveLength(1);
    expect(concurrent.filter(({ kind }) => kind === 'duplicate')).toHaveLength(9);
    expect(await repository.countAnswers(questionId)).toBe(2);
  });

  it('classifies invalid content and missing references without writes', async () => {
    const { repository, questionId } = await draft();
    await repository.publish(questionId, 'creator', hour);
    expect(
      await repository.submit(
        questionId,
        'answerer',
        { answer: ' ', excerpt: 'Excerpt' },
        2 * hour,
      ),
    ).toEqual({ kind: 'invalid' });
    expect(
      await repository.submit(
        questionId,
        'missing-user',
        { answer: 'Answer', excerpt: 'Excerpt' },
        2 * hour,
      ),
    ).toEqual({ kind: 'reference-missing' });
    expect(await repository.countAnswers(questionId)).toBe(0);
  });
});
