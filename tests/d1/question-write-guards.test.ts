import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { createQuestionRepository } from '../../src/repositories/question-repository';
import { applyMigrations } from './apply-migrations';
import { insertUser, userFixture } from './fixtures';

describe('question write guards', () => {
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

  async function draft(closesAt = 5_000, revealsAt = 6_000) {
    const repository = createQuestionRepository(env.TEST_DB);
    await repository.createDraft(
      {
        id: 'question',
        creatorUserId: 'creator',
        body: 'Question',
        language: 'en',
        closesAt,
        revealsAt,
      },
      1_000,
    );
    return repository;
  }

  it('publishes only once for the creator before close', async () => {
    const repository = await draft();
    expect(await repository.publish('question', 'answerer', 2_000)).toEqual({
      kind: 'creator-mismatch',
    });
    expect(await repository.publish('question', 'creator', 2_000)).toMatchObject({
      kind: 'published',
    });
    expect(await repository.publish('question', 'creator', 2_001)).toEqual({
      kind: 'invalid-transition',
    });
  });

  it.each([
    ['draft', null, 2_000, 'not-open'],
    ['at close', 1_000, 5_000, 'not-open'],
    ['closed', 1_000, 5_500, 'not-open'],
    ['revealed', 1_000, 6_000, 'not-open'],
  ] as const)('rejects submission when %s', async (_label, publishedAt, now, expected) => {
    const repository = await draft();
    if (publishedAt !== null) await repository.publish('question', 'creator', publishedAt);
    expect(
      await repository.submit(
        'question',
        'answerer',
        { answer: 'Answer', excerpt: 'Excerpt' },
        now,
      ),
    ).toEqual({ kind: expected });
  });

  it('keeps one answer across sequential and concurrent duplicate attempts', async () => {
    const repository = await draft();
    await repository.publish('question', 'creator', 2_000);
    const sequential = [];
    for (let index = 0; index < 10; index += 1) {
      sequential.push(
        await repository.submit(
          'question',
          'answerer',
          { answer: `Answer ${index}`, excerpt: `Excerpt ${index}` },
          3_000,
        ),
      );
    }
    expect(sequential.filter(({ kind }) => kind === 'submitted')).toHaveLength(1);
    expect(sequential.filter(({ kind }) => kind === 'duplicate')).toHaveLength(9);

    await insertUser(env.TEST_DB, userFixture('concurrent'));
    const concurrent = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        repository.submit(
          'question',
          'concurrent',
          { answer: `Concurrent ${index}`, excerpt: `Concurrent ${index}` },
          3_100,
        ),
      ),
    );
    expect(concurrent.filter(({ kind }) => kind === 'submitted')).toHaveLength(1);
    expect(concurrent.filter(({ kind }) => kind === 'duplicate')).toHaveLength(9);
    expect(await repository.countAnswers('question')).toBe(2);
  });

  it('classifies invalid content and missing references without writes', async () => {
    const repository = await draft();
    await repository.publish('question', 'creator', 2_000);
    expect(
      await repository.submit('question', 'answerer', { answer: ' ', excerpt: 'Excerpt' }, 3_000),
    ).toEqual({ kind: 'invalid' });
    expect(
      await repository.submit(
        'question',
        'missing-user',
        { answer: 'Answer', excerpt: 'Excerpt' },
        3_000,
      ),
    ).toEqual({ kind: 'reference-missing' });
    expect(await repository.countAnswers('question')).toBe(0);
  });
});
