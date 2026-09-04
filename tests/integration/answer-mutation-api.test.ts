import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import type { Authentication } from '../../src/auth/session';
import {
  createAnswer,
  createInMemoryQuestionRepository,
  draftQuestion,
  openQuestion,
} from '../helpers/question-repository';

function authentication(userId: string | undefined): Authentication {
  return {
    getSession: vi.fn().mockResolvedValue(userId === undefined ? null : { user: { id: userId } }),
    handle: vi.fn(),
  };
}

const sameOriginHeaders = {
  Origin: 'http://example.test',
  'Sec-Fetch-Site': 'same-origin',
} as const;

describe('Answer mutation API', () => {
  it('updates, removes, and permits resubmission only for the caller before deadline', async () => {
    const repository = createInMemoryQuestionRepository({
      question: openQuestion,
      answers: [createAnswer()],
    });
    const app = createApp({ authentication: authentication('user-1'), repository, now: () => 99 });
    const update = await app.request('http://example.test/api/questions/question-1/my-answer', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...sameOriginHeaders },
      body: JSON.stringify({ answer: 'Updated', excerpt: 'Updated excerpt' }),
    });
    expect(await update.json()).toEqual({
      questionId: 'question-1',
      status: 'updated',
      updatedAt: '1970-01-01T00:00:00.099Z',
    });
    const remove = await app.request('http://example.test/api/questions/question-1/my-answer', {
      method: 'DELETE',
      headers: sameOriginHeaders,
    });
    expect(remove.status).toBe(200);
    expect(await repository.getMine('question-1', 'user-1')).toBeNull();
    const submit = await app.request('http://example.test/api/questions/question-1/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: 'New', excerpt: 'New excerpt' }),
    });
    expect(submit.status).toBe(201);
  });

  it('does not expose or mutate another user answer', async () => {
    const repository = createInMemoryQuestionRepository({
      question: openQuestion,
      answers: [createAnswer({ userId: 'other' })],
    });
    const app = createApp({ authentication: authentication('user-1'), repository, now: () => 99 });
    for (const method of ['PUT', 'DELETE']) {
      const response = await app.request('http://example.test/api/questions/question-1/my-answer', {
        method,
        headers: { 'Content-Type': 'application/json', ...sameOriginHeaders },
        ...(method === 'PUT'
          ? { body: JSON.stringify({ answer: 'Changed', excerpt: 'Changed' }) }
          : {}),
      });
      expect(await response.json()).toMatchObject({ code: 'ANSWER_NOT_FOUND' });
    }
    expect(await repository.getMine('question-1', 'other')).toMatchObject({
      body: 'A private answer body.',
    });
  });

  it('rejects mutations at the deadline and unauthenticated requests', async () => {
    const repository = createInMemoryQuestionRepository({
      question: openQuestion,
      answers: [createAnswer()],
    });
    const closed = createApp({
      authentication: authentication('user-1'),
      repository,
      now: () => 100,
    });
    const response = await closed.request(
      'http://example.test/api/questions/question-1/my-answer',
      {
        method: 'DELETE',
        headers: sameOriginHeaders,
      },
    );
    expect(await response.json()).toMatchObject({ code: 'QUESTION_CLOSED' });
    const unauthenticated = createApp({
      authentication: authentication(undefined),
      repository,
      now: () => 99,
    });
    expect(
      (
        await unauthenticated.request('http://example.test/api/questions/question-1/my-answer', {
          method: 'DELETE',
          headers: sameOriginHeaders,
        })
      ).status,
    ).toBe(401);
  });

  it('does not enumerate a draft through update or remove errors', async () => {
    const app = createApp({
      authentication: authentication('user-1'),
      repository: createInMemoryQuestionRepository({ question: draftQuestion }),
      now: () => 99,
    });
    for (const method of ['PUT', 'DELETE']) {
      const response = await app.request('http://example.test/api/questions/question-1/my-answer', {
        method,
        headers: { 'Content-Type': 'application/json', ...sameOriginHeaders },
        ...(method === 'PUT'
          ? { body: JSON.stringify({ answer: 'Changed', excerpt: 'Changed' }) }
          : {}),
      });
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ code: 'QUESTION_NOT_FOUND' });
    }
  });

  it('rejects cross-origin updates and removals without changing the answer', async () => {
    const repository = createInMemoryQuestionRepository({
      question: openQuestion,
      answers: [createAnswer()],
    });
    const app = createApp({ authentication: authentication('user-1'), repository, now: () => 99 });
    const crossOriginHeaders = {
      Origin: 'https://attacker.example.test',
      'Sec-Fetch-Site': 'same-site',
    };
    const update = await app.request('http://example.test/api/questions/question-1/my-answer', {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain', ...crossOriginHeaders },
      body: JSON.stringify({ answer: 'Injected', excerpt: 'Injected excerpt' }),
    });
    const remove = await app.request('http://example.test/api/questions/question-1/my-answer', {
      method: 'DELETE',
      headers: crossOriginHeaders,
    });
    expect(update.status).toBe(403);
    expect(remove.status).toBe(403);
    expect(await repository.getMine('question-1', 'user-1')).toMatchObject({
      body: 'A private answer body.',
    });
  });
});
