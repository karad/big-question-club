import { env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { createQuestionRepository } from '../../src/repositories/question-repository';
import { applyMigrations } from './apply-migrations';
import { insertUser, userFixture } from './fixtures';

describe('D1 question repository', () => {
  const hour = 60 * 60 * 1000;
  let questionId = '';
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
        creatorUserId: 'creator',
        body: 'What makes an answer useful?',
        language: 'en',
        closesAt: 3 * hour,
        revealsAt: 3 * hour,
      },
      0,
    );
    expect(created.kind).toBe('created');
    if (created.kind !== 'created') throw new Error('Question was not created');
    questionId = created.question.id;
    expect(await repository.publish(questionId, 'creator', hour)).toMatchObject({
      kind: 'published',
    });
    expect(await repository.getQuestion(questionId)).toMatchObject({
      creatorUserId: 'creator',
      publishedAt: hour,
    });
    expect(
      await repository.submit(
        questionId,
        'answerer-1',
        { answer: 'First answer', excerpt: 'First excerpt' },
        2 * hour,
      ),
    ).toMatchObject({ kind: 'submitted' });
    expect(
      await repository.submit(
        questionId,
        'answerer-2',
        { answer: 'Second answer', excerpt: 'Second excerpt' },
        2 * hour + 1,
      ),
    ).toMatchObject({ kind: 'submitted' });
    expect(await repository.countAnswers(questionId)).toBe(2);
  });

  it('classifies duplicate and missing references', async () => {
    const repository = createQuestionRepository(env.TEST_DB);
    expect(
      await repository.submit(
        questionId,
        'answerer-1',
        { answer: 'Duplicate', excerpt: 'Duplicate' },
        2 * hour + 100,
      ),
    ).toEqual({ kind: 'duplicate' });
    expect(
      await repository.submit(
        'missing',
        'answerer-1',
        { answer: 'Missing', excerpt: 'Missing' },
        2 * hour + 100,
      ),
    ).toEqual({ kind: 'missing' });
    expect(
      await repository.submit(
        questionId,
        'unknown-user',
        { answer: 'Unknown', excerpt: 'Unknown' },
        2 * hour + 100,
      ),
    ).toEqual({ kind: 'reference-missing' });
  });
});
