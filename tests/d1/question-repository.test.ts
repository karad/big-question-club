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

  it('atomically updates and removes only the caller answer while open', async () => {
    const repository = createQuestionRepository(env.TEST_DB);
    const updated = await repository.updateAnswer(
      questionId,
      'answerer-1',
      { answer: 'Revised answer', excerpt: 'Revised excerpt' },
      2 * hour + 200,
    );
    expect(updated).toMatchObject({
      kind: 'updated',
      answer: { body: 'Revised answer', excerpt: 'Revised excerpt', updatedAt: 2 * hour + 200 },
    });
    expect(
      await repository.updateAnswer(
        questionId,
        'unknown-user',
        { answer: 'No access', excerpt: 'No access' },
        2 * hour + 201,
      ),
    ).toEqual({ kind: 'answer-missing' });
    expect(await repository.removeAnswer(questionId, 'answerer-1', 2 * hour + 202)).toEqual({
      kind: 'removed',
    });
    expect(await repository.getMine(questionId, 'answerer-1')).toBeNull();
    expect(await repository.getMine(questionId, 'answerer-2')).toMatchObject({
      body: 'Second answer',
    });
    expect(await repository.removeAnswer(questionId, 'answerer-2', 3 * hour)).toEqual({
      kind: 'not-open',
    });
  });

  it('classifies a draft as missing for every answer mutation', async () => {
    const repository = createQuestionRepository(env.TEST_DB);
    const draft = await repository.createDraft(
      {
        creatorUserId: 'creator',
        body: 'This draft must not be enumerable through answer operations.',
        language: 'en',
        closesAt: 4 * hour,
        revealsAt: 4 * hour,
      },
      0,
    );
    if (draft.kind !== 'created') throw new Error('Draft was not created');
    expect(
      await repository.submit(
        draft.question.id,
        'answerer-1',
        { answer: 'Answer', excerpt: 'Excerpt' },
        hour,
      ),
    ).toEqual({ kind: 'missing' });
    expect(
      await repository.updateAnswer(
        draft.question.id,
        'answerer-1',
        { answer: 'Answer', excerpt: 'Excerpt' },
        hour,
      ),
    ).toEqual({ kind: 'missing' });
    expect(await repository.removeAnswer(draft.question.id, 'answerer-1', hour)).toEqual({
      kind: 'missing',
    });
  });
});
