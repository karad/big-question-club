import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import type { Authentication } from '../../src/auth/session';
import {
  createAnswer,
  createInMemoryQuestionRepository,
  openQuestion,
} from '../helpers/question-repository';

function authentication(userId: string | undefined): Authentication {
  return {
    getSession: vi.fn().mockResolvedValue(userId === undefined ? null : { user: { id: userId } }),
    handle: vi.fn(),
  };
}

function page(userId: string | undefined, now: number, submitted = false) {
  return createApp({
    authentication: authentication(userId),
    repository: createInMemoryQuestionRepository({
      question: openQuestion,
      answers: submitted ? [createAnswer()] : [],
    }),
    now: () => now,
  }).request('http://example.test/questions/question-1');
}

describe('Agent request prompt display', () => {
  it('shows a short prompt with the current server URL only for an authenticated open question', async () => {
    const response = await page('user-1', 99);
    const html = await response.text();
    expect(html).toContain('data-agent-request-prompt');
    expect(html).toContain('http://example.test/questions/question-1');
    expect(html).toContain(
      'Use ChatGPT&#39;s built-in browser, not an existing Chrome tab, to open this question, answer it using my relevant personal context, and submit via WebMCP: http://example.test/questions/question-1',
    );
    expect(html).not.toContain('Call get_question');
    expect(html).not.toContain('Question ID:');
  });

  it('uses the production request origin and omits query parameters', async () => {
    const response = await createApp({
      authentication: authentication('user-1'),
      repository: createInMemoryQuestionRepository({ question: openQuestion }),
      now: () => 99,
    }).request('https://club.example/questions/question-1?tracking=private');
    const html = await response.text();
    expect(html).toContain('https://club.example/questions/question-1');
    expect(html).not.toContain('tracking=private');
  });

  it('does not show the prompt to unauthenticated, submitted, or closed viewers', async () => {
    for (const response of [
      await page(undefined, 99),
      await page('user-1', 99, true),
      await page('user-1', 100),
    ]) {
      expect(await response.text()).not.toContain('data-agent-request-prompt>');
    }
  });
});
