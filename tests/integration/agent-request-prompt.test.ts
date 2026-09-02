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
  it('shows the fixed prompt only for an authenticated, unsubmitted, open question', async () => {
    const response = await page('user-1', 99);
    const html = await response.text();
    expect(html).toContain('data-agent-request-prompt');
    expect(html).toContain('Question ID: question-1');
    expect(html).not.toContain('Question ID: What makes an answer useful?');
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
