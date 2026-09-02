import { env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { createQuestionRepository } from '../../src/repositories/question-repository';
import { applyMigrations } from './apply-migrations';
import { insertUser, userFixture } from './fixtures';

describe('D1 question repository', () => {
  beforeAll(async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS);
    await insertUser(env.TEST_DB, userFixture('creator'));
    await insertUser(env.TEST_DB, userFixture('answerer-1'));
    await insertUser(env.TEST_DB, userFixture('answerer-2'));
  });

  it('creates, publishes, and reloads a question with related answers', async () => {
    const repository = createQuestionRepository(env.TEST_DB);
    const created = await repository.createDraft(
      {
        id: 'question',
        creatorUserId: 'creator',
        body: 'What makes an answer useful?',
        language: 'en',
        closesAt: 5_000,
        revealsAt: 6_000,
      },
      1_000,
    );
    expect(created.kind).toBe('created');
    expect(await repository.publish('question', 'creator', 2_000)).toMatchObject({
      kind: 'published',
    });
    expect(await repository.getQuestion('question')).toMatchObject({
      creatorUserId: 'creator',
      publishedAt: 2_000,
    });
    expect(
      await repository.submit(
        'question',
        'answerer-1',
        { answer: 'First answer', excerpt: 'First excerpt' },
        3_000,
      ),
    ).toMatchObject({ kind: 'submitted' });
    expect(
      await repository.submit(
        'question',
        'answerer-2',
        { answer: 'Second answer', excerpt: 'Second excerpt' },
        3_001,
      ),
    ).toMatchObject({ kind: 'submitted' });
    expect(await repository.countAnswers('question')).toBe(2);
  });

  it('classifies duplicate and missing references', async () => {
    const repository = createQuestionRepository(env.TEST_DB);
    expect(
      await repository.submit(
        'question',
        'answerer-1',
        { answer: 'Duplicate', excerpt: 'Duplicate' },
        3_100,
      ),
    ).toEqual({ kind: 'duplicate' });
    expect(
      await repository.submit(
        'missing',
        'answerer-1',
        { answer: 'Missing', excerpt: 'Missing' },
        3_100,
      ),
    ).toEqual({ kind: 'missing' });
    expect(
      await repository.submit(
        'question',
        'unknown-user',
        { answer: 'Unknown', excerpt: 'Unknown' },
        3_100,
      ),
    ).toEqual({ kind: 'reference-missing' });
  });
});
