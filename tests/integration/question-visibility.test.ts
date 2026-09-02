import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import type { Authentication } from '../../src/auth/session';
import {
  createAnswer,
  closedQuestion,
  createInMemoryQuestionRepository,
  openQuestion,
} from '../helpers/question-repository';

function authentication(userId: string | undefined): Authentication {
  return {
    getSession: vi.fn().mockResolvedValue(userId === undefined ? null : { user: { id: userId } }),
    handle: vi.fn(),
  };
}

function appFor(userId: string | undefined, now: number) {
  return createApp({
    authentication: authentication(userId),
    repository: createInMemoryQuestionRepository({
      question: openQuestion,
      answers: [
        createAnswer(),
        createAnswer({
          id: 'answer-2',
          userId: 'user-2',
          body: 'Another private body.',
          excerpt: 'Another excerpt.',
        }),
      ],
    }),
    now: () => now,
  });
}

describe('Question visibility', () => {
  it('seals every other answer before the deadline across SSR and HTTP', async () => {
    const app = appFor('user-1', 99);
    const page = await app.request('http://example.test/questions/question-1');
    const html = await page.text();
    expect(html).toContain('Answers are sealed.');
    expect(html).toContain('A private answer body.');
    expect(html).not.toContain('Another private body.');
    expect(html).not.toContain('Another excerpt.');
    const question = await app.request('http://example.test/api/questions/question-1');
    expect(await question.json()).toEqual({
      id: 'question-1',
      question: 'What makes an answer useful?',
      answerCount: 2,
      closesAt: '1970-01-01T00:00:00.100Z',
      mySubmissionStatus: 'submitted',
    });
    const detail = await app.request(
      'http://example.test/api/questions/question-1/answers/answer-2',
    );
    expect(detail.status).toBe(404);
    expect(await detail.json()).toMatchObject({ code: 'ANSWER_UNAVAILABLE' });
  });

  it('does not reveal an answer to unauthenticated direct requests', async () => {
    const app = appFor(undefined, 100);
    expect((await app.request('http://example.test/questions/question-1')).status).toBe(401);
    const detail = await app.request(
      'http://example.test/api/questions/question-1/answers/answer-1',
    );
    expect(detail.status).toBe(404);
    expect(JSON.stringify(await detail.json())).not.toContain('private');
  });

  it('does not provide answer lists, excerpts, summaries, or search endpoints', async () => {
    const app = appFor('user-1', 99);
    for (const path of [
      '/api/questions/question-1/answers',
      '/api/questions/question-1/excerpts',
      '/api/questions/question-1/answers/search',
    ]) {
      const response = await app.request(`http://example.test${path}`);
      expect(response.status).toBe(404);
      expect(await response.text()).not.toContain('Another');
    }
  });

  it('shows only excerpts in revealed SSR and returns only the requested detail body', async () => {
    const app = appFor('user-1', 100);
    const page = await app.request('http://example.test/questions/question-1');
    const html = await page.text();
    expect(html).toContain('A one-line excerpt.');
    expect(html).toContain('Another excerpt.');
    expect(html).not.toContain('A private answer body.');
    expect(html).not.toContain('Another private body.');
    expect(html).toContain('src="/client.js"');
    const detail = await app.request(
      'http://example.test/api/questions/question-1/answers/answer-2',
    );
    expect(await detail.json()).toEqual({ id: 'answer-2', body: 'Another private body.' });
    const missing = await app.request('http://example.test/api/questions/question-1/answers/nope');
    expect(missing.status).toBe(404);
  });

  it('keeps answers sealed between close and reveal', async () => {
    const repository = createInMemoryQuestionRepository({
      question: closedQuestion,
      answers: [createAnswer()],
    });
    const app = createApp({
      authentication: authentication('user-1'),
      repository,
      now: () => 100,
    });

    const html = await (await app.request('http://example.test/questions/question-1')).text();
    expect(html).toContain('Answers are sealed.');
    expect(html).toContain('A private answer body.');
    expect(html).not.toContain('A one-line excerpt.</button>');
    expect(
      (await app.request('http://example.test/api/questions/question-1/answers/answer-1')).status,
    ).toBe(404);
  });

  it('keeps the WebMCP-compatible status endpoint free of other answers after reveal', async () => {
    const app = appFor('user-1', 100);
    const response = await app.request(
      'http://example.test/api/questions/question-1/my-submission',
    );
    expect(await response.json()).toEqual({
      questionId: 'question-1',
      status: 'submitted',
      answer: 'A private answer body.',
      excerpt: 'A one-line excerpt.',
      submittedAt: '1970-01-01T00:00:00.010Z',
    });
  });

  it('renders a revealed empty state without an invented answer', async () => {
    const app = createApp({
      authentication: authentication('user-1'),
      repository: createInMemoryQuestionRepository({ question: openQuestion }),
      now: () => 100,
    });
    const html = await (await app.request('http://example.test/questions/question-1')).text();
    expect(html).toContain('No answers have been submitted.');
    expect(html).not.toContain('data-answer-id');
  });
});
