import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import type { QuestionRepository } from '../../src/repositories/question-repository';
import {
  createAnswer,
  createInMemoryQuestionRepository,
  openQuestion,
} from '../helpers/question-repository';

describe('Home question browsing', () => {
  it('shows open questions with public discovery details and stable hooks', async () => {
    const now = 1_000;
    const repository = createInMemoryQuestionRepository({
      questions: [
        { ...openQuestion, id: 'later', body: 'Later question', closesAt: 4_000, revealsAt: 4_000 },
        {
          ...openQuestion,
          id: 'first',
          body: '<strong>First question</strong>',
          closesAt: 3_000,
          revealsAt: 3_000,
        },
        { ...openQuestion, id: 'draft', body: 'Private draft', publishedAt: null },
        { ...openQuestion, id: 'closed', body: 'Closed question', closesAt: now, revealsAt: now },
      ],
      answers: [
        createAnswer({
          questionId: 'first',
          body: 'HOME_PRIVATE_BODY',
          excerpt: 'HOME_PRIVATE_EXCERPT',
        }),
      ],
    });
    const response = await createApp({ repository, now: () => now }).request(
      'http://example.test/',
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html.indexOf('&lt;strong&gt;First question&lt;/strong&gt;')).toBeLessThan(
      html.indexOf('Later question'),
    );
    expect(html).toContain('1 answer');
    expect(html).toContain('0 answers');
    expect(html).toContain('Answers are sealed');
    expect(html).toContain('Deadline');
    expect(html).toContain('Time remaining');
    expect(html).toContain('href="/questions/first"');
    expect(html).toContain('data-question-list');
    expect(html).toContain('data-question-card');
    expect(html).not.toContain('Private draft');
    expect(html).not.toContain('Closed question');
    expect(html).not.toContain('HOME_PRIVATE_BODY');
    expect(html).not.toContain('HOME_PRIVATE_EXCERPT');
  });

  it('uses one service-time snapshot for the entire response', async () => {
    const now = vi.fn().mockReturnValueOnce(99).mockReturnValueOnce(100);
    const response = await createApp({
      repository: createInMemoryQuestionRepository({ question: openQuestion }),
      now,
    }).request('http://example.test/');

    expect(response.status).toBe(200);
    expect(now).toHaveBeenCalledTimes(1);
    expect(await response.text()).toContain('Less than 1 minute');
  });

  it('distinguishes the empty state from a repository failure', async () => {
    const empty = await createApp({
      repository: createInMemoryQuestionRepository(),
      now: () => 50,
    }).request('http://example.test/');
    expect(empty.status).toBe(200);
    expect(await empty.text()).toContain('No open questions right now.');

    const unavailableRepository = {
      ...createInMemoryQuestionRepository(),
      listOpenQuestions: vi.fn().mockRejectedValue(new Error('unavailable')),
    } satisfies QuestionRepository;
    const unavailable = await createApp({ repository: unavailableRepository }).request(
      'http://example.test/',
    );
    expect(unavailable.status).toBe(503);
    expect(await unavailable.text()).toContain('Questions are temporarily unavailable. Try again.');
  });

  it('keeps application copy English while preserving question text', async () => {
    const response = await createApp({
      repository: createInMemoryQuestionRepository({
        question: {
          ...openQuestion,
          body: '人類が次に考えるべき問いは何ですか？',
        },
      }),
      now: () => 50,
    }).request('http://example.test/');
    const html = await response.text();

    expect(html).toContain('data-page="home"');
    expect(html).toContain('data-site-header');
    expect(html).toContain('big-question-club-logo.svg');
    expect(html).toContain('data-question-list');
    expect(html).toContain('data-question-card');
    expect(html).toContain('data-answer-count');
    expect(html).toContain('data-time-remaining');
    expect(html).toContain('data-sealed-status');
    expect(html).toContain('Open questions');
    expect(html).toContain('人類が次に考えるべき問いは何ですか？');
    expect(html).not.toContain('Japanese');
    expect(html).not.toContain('Primary language');
  });
});
