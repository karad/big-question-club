import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import type { Authentication } from '../../src/auth/session';
import {
  createAnswer,
  createInMemoryQuestionRepository,
  openQuestion,
} from '../helpers/question-repository';

const signedIn = (userId: string): Authentication => ({
  getSession: vi.fn().mockResolvedValue({ user: { id: userId } }),
  handle: vi.fn(),
});

describe('question list pages', () => {
  it('paginates open questions at twenty items with navigation', async () => {
    const questions = Array.from({ length: 21 }, (_, index) => ({
      ...openQuestion,
      id: `open-${String(index).padStart(2, '0')}`,
      body: `Open question number ${index}`,
      closesAt: 10_000 + index,
      revealsAt: 10_000 + index,
    }));
    const app = createApp({
      repository: createInMemoryQuestionRepository({ questions }),
      now: () => 1,
    });
    const first = await app.request('http://example.test/questions/open');
    const second = await app.request('http://example.test/questions/open?page=2');
    expect((await first.text()).match(/data-question-card/g)).toHaveLength(20);
    const html = await second.text();
    expect(html.match(/data-question-card/g)).toHaveLength(1);
    expect(html).toContain('Previous');
    expect(html).toContain('Page 2 of 2');
  });
  it('returns an actionable empty page for invalid and out-of-range input', async () => {
    const app = createApp({ repository: createInMemoryQuestionRepository(), now: () => 1 });
    expect(
      await (await app.request('http://example.test/questions/revealed?page=invalid')).text(),
    ).toContain('No results on this page.');
    expect(
      await (await app.request('http://example.test/questions/open?page=99')).text(),
    ).toContain('Go to page 1');
  });

  it.each([
    ['open', 99],
    ['revealed', 100],
  ] as const)('shows a badge only for answered questions on the %s list', async (kind, now) => {
    const questions = [
      { ...openQuestion, id: 'answered-question' },
      { ...openQuestion, id: 'unanswered-question' },
    ];
    const app = createApp({
      authentication: signedIn('viewer'),
      repository: createInMemoryQuestionRepository({
        questions,
        answers: [createAnswer({ questionId: 'answered-question', userId: 'viewer' })],
      }),
      now: () => now,
    });
    const html = await (await app.request(`http://example.test/questions/${kind}`)).text();

    expect(html.match(/data-submission-status="answered"/g)).toHaveLength(1);
    expect(html).not.toContain('data-submission-status="not-answered"');
    expect(html).not.toContain('Not answered');
  });
});
