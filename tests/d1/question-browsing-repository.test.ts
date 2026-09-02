import { env } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { createQuestionRepository } from '../../src/repositories/question-repository';
import { applyMigrations } from './apply-migrations';
import { insertUser, userFixture } from './fixtures';

describe('D1 question browsing repository', () => {
  const snapshotNow = 1_000_000_000;

  beforeAll(async () => {
    await applyMigrations(env.TEST_DB, env.TEST_MIGRATIONS);
    await insertUser(env.TEST_DB, userFixture('browsing-creator'));
    await insertUser(env.TEST_DB, userFixture('browsing-answerer'));

    const insertQuestion = async (
      id: string,
      publishedAt: number | null,
      closesAt: number,
      createdAt: number,
    ) => {
      await env.TEST_DB.prepare(
        'INSERT INTO questions (id, creator_user_id, body, language, published_at, closes_at, reveals_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(
          id,
          'browsing-creator',
          `Browsing question ${id}`,
          id.endsWith('ja') ? 'ja' : 'en',
          publishedAt,
          closesAt,
          closesAt,
          createdAt,
          createdAt,
        )
        .run();
    };

    await insertQuestion('browsing-draft', null, snapshotNow + 1_000, 1);
    await insertQuestion('browsing-open-later', snapshotNow - 20, snapshotNow + 2_000, 2);
    await insertQuestion('browsing-open-first-en', snapshotNow - 30, snapshotNow + 1_000, 3);
    await insertQuestion('browsing-open-first-ja', snapshotNow - 30, snapshotNow + 1_000, 3);
    await insertQuestion('browsing-at-deadline', snapshotNow - 30, snapshotNow, 4);

    await env.TEST_DB.prepare(
      'INSERT INTO answers (id, question_id, user_id, body, excerpt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        'browsing-secret-answer',
        'browsing-open-first-en',
        'browsing-answerer',
        'D1_PRIVATE_BODY_SENTINEL',
        'D1_PRIVATE_EXCERPT_SENTINEL',
        snapshotNow - 10,
        snapshotNow - 10,
      )
      .run();
  });

  it('returns only open questions in a stable deadline order with aggregate counts', async () => {
    const summaries = await createQuestionRepository(env.TEST_DB).listOpenQuestions(snapshotNow);
    const browsing = summaries.filter(({ question }) => question.id.startsWith('browsing-'));

    expect(browsing.map(({ question }) => question.id)).toEqual([
      'browsing-open-first-en',
      'browsing-open-first-ja',
      'browsing-open-later',
    ]);
    expect(browsing.map(({ answerCount }) => answerCount)).toEqual([1, 0, 0]);
  });

  it('does not project answer secrets into an open-question summary', async () => {
    const summaries = await createQuestionRepository(env.TEST_DB).listOpenQuestions(snapshotNow);
    const serialized = JSON.stringify(summaries);

    expect(serialized).not.toContain('D1_PRIVATE_BODY_SENTINEL');
    expect(serialized).not.toContain('D1_PRIVATE_EXCERPT_SENTINEL');
    expect(serialized).not.toContain('browsing-secret-answer');
  });
});
