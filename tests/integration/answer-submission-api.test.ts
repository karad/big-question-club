import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import type { Authentication } from '../../src/auth/session';
import { createInMemoryQuestionRepository, openQuestion } from '../helpers/question-repository';

function authentication(userId: string | undefined): Authentication {
  return {
    getSession: vi.fn().mockResolvedValue(userId === undefined ? null : { user: { id: userId } }),
    handle: vi.fn(),
  };
}

function request(body: unknown): Request {
  return new Request('http://example.test/api/questions/question-1/answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Answer submission API', () => {
  it('accepts one authenticated submission and never overwrites it', async () => {
    const repository = createInMemoryQuestionRepository({ question: openQuestion });
    const app = createApp({ authentication: authentication('user-1'), repository, now: () => 99 });
    expect(
      (await app.request(request({ answer: 'Original', excerpt: 'Original excerpt' }))).status,
    ).toBe(201);
    const duplicate = await app.request(
      request({ answer: 'Replacement', excerpt: 'Replacement excerpt' }),
    );
    expect(duplicate.status).toBe(409);
    expect(await repository.getMine('question-1', 'user-1')).toMatchObject({
      body: 'Original',
      excerpt: 'Original excerpt',
    });
  });

  it('keeps exactly one answer when ten submissions race', async () => {
    const repository = createInMemoryQuestionRepository({ question: openQuestion });
    const app = createApp({ authentication: authentication('user-1'), repository, now: () => 99 });
    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        app.request(request({ answer: `Answer ${index}`, excerpt: `Excerpt ${index}` })),
      ),
    );
    expect(responses.filter((response) => response.status === 201)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 409)).toHaveLength(9);
    expect(await repository.countAnswers('question-1')).toBe(1);
  });

  it.each([
    ['before the deadline', 99, 201],
    ['at the deadline', 100, 409],
    ['after the deadline', 101, 409],
  ])('uses the Worker clock %s', async (_label, now, expectedStatus) => {
    const app = createApp({
      authentication: authentication('user-1'),
      repository: createInMemoryQuestionRepository({ question: openQuestion }),
      now: () => now,
    });
    const response = await app.request(request({ answer: 'Answer', excerpt: 'Excerpt' }));
    expect(response.status).toBe(expectedStatus);
    if (expectedStatus !== 201)
      expect(await response.json()).toMatchObject({ code: 'QUESTION_CLOSED' });
  });

  it('rejects unauthenticated, invalid, and missing-question submissions', async () => {
    const unauthenticated = createApp({
      authentication: authentication(undefined),
      repository: createInMemoryQuestionRepository({ question: openQuestion }),
      now: () => 99,
    });
    expect(
      (await unauthenticated.request(request({ answer: 'Answer', excerpt: 'Excerpt' }))).status,
    ).toBe(401);
    const app = createApp({
      authentication: authentication('user-1'),
      repository: createInMemoryQuestionRepository({ question: openQuestion }),
      now: () => 99,
    });
    expect((await app.request(request({ answer: 'Answer', excerpt: 'two\nlines' }))).status).toBe(
      400,
    );
    expect(
      (
        await app.request(
          new Request('http://example.test/api/questions/missing/answers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: 'Answer', excerpt: 'Excerpt' }),
          }),
        )
      ).status,
    ).toBe(404);
  });
});
