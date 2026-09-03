import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import type { Authentication } from '../../src/auth/session';
import type { QuestionRepository } from '../../src/repositories/question-repository';
import {
  closedQuestion,
  createAnswer,
  createInMemoryQuestionRepository,
  draftQuestion,
  openQuestion,
} from '../helpers/question-repository';

function authentication(userId?: string): Authentication {
  return {
    getSession: vi.fn().mockResolvedValue(userId === undefined ? null : { user: { id: userId } }),
    handle: vi.fn(),
  };
}

function appFor({
  question = openQuestion,
  userId,
  now = 99,
}: {
  question?: typeof openQuestion;
  userId?: string;
  now?: number;
} = {}) {
  return createApp({
    authentication: authentication(userId),
    repository: createInMemoryQuestionRepository({
      question,
      answers: [
        createAnswer({
          userId: 'other-user',
          body: 'DETAIL_PRIVATE_BODY',
          excerpt: 'DETAIL_PRIVATE_EXCERPT',
        }),
      ],
    }),
    now: () => now,
  });
}

describe('Question browsing detail', () => {
  it('shows public open details and a sign-in action to an anonymous human', async () => {
    const response = await appFor().request('http://example.test/questions/question-1');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(html).toContain('What makes an answer useful?');
    expect(html).not.toContain('Primary language');
    expect(html).toContain('Status: OPEN');
    expect(html).toContain('Answers submitted: 1');
    expect(html).toContain('1970-01-01T00:00:00.100Z');
    expect(html).toContain('>1970-01-01 00:00</time>');
    expect(html).toContain('Less than 1 minute');
    expect(html).toContain('Answers are sealed.');
    expect(html).toContain('Sign in to answer with your personal agent.');
    expect(html).toContain('id="google-sign-in"');
    expect(html).not.toContain('data-agent-request-prompt');
    expect(html).not.toContain('DETAIL_PRIVATE_BODY');
    expect(html).not.toContain('DETAIL_PRIVATE_EXCERPT');
  });

  it('identifies the creator without granting access to another answer', async () => {
    const html = await (
      await appFor({ userId: 'creator-1' }).request('http://example.test/questions/question-1')
    ).text();

    expect(html).toContain('You created this question.');
    expect(html).toContain('data-agent-request-prompt');
    expect(html).not.toContain('DETAIL_PRIVATE_BODY');
    expect(html).not.toContain('DETAIL_PRIVATE_EXCERPT');
  });

  it('shows the existing personal-agent prompt to an authenticated unsubmitted human', async () => {
    const html = await (
      await appFor({ userId: 'new-user' }).request('http://example.test/questions/question-1')
    ).text();

    expect(html).toContain('Ask your personal agent');
    expect(html).not.toContain('data-submission-status');
    expect(html).not.toContain('Not answered');
    expect(html).toContain('http://example.test/questions/question-1');
    expect(html).toContain('Copy prompt');
  });

  it('shows closed and sealed state without a new-answer prompt', async () => {
    const html = await (
      await appFor({ question: closedQuestion, userId: 'new-user', now: 100 }).request(
        'http://example.test/questions/question-1',
      )
    ).text();

    expect(html).toContain('Status: CLOSED');
    expect(html).toContain('Answer submissions are closed.');
    expect(html).toContain('Answers remain sealed until reveal.');
    expect(html).not.toContain('data-agent-request-prompt');
  });

  it('uses the same unavailable response for a draft and a missing question', async () => {
    const draft = await createApp({
      authentication: authentication(),
      repository: createInMemoryQuestionRepository({ question: draftQuestion }),
      now: () => 99,
    }).request('http://example.test/questions/question-1');
    const missing = await createApp({
      authentication: authentication(),
      repository: createInMemoryQuestionRepository(),
      now: () => 99,
    }).request('http://example.test/questions/question-1');

    expect(draft.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(await draft.text()).toBe(await missing.text());
    const unavailable = await createApp({
      repository: createInMemoryQuestionRepository(),
    }).request('/questions/missing');
    expect(await unavailable.text()).toBe('Question unavailable.');
  });

  it('returns a distinct 503 when public question data is unavailable', async () => {
    const repository = {
      ...createInMemoryQuestionRepository(),
      getQuestion: vi.fn().mockRejectedValue(new Error('unavailable')),
    } satisfies QuestionRepository;
    const response = await createApp({
      authentication: authentication(),
      repository,
    }).request('http://example.test/questions/question-1');

    expect(response.status).toBe(503);
    expect(await response.text()).toContain('Question is temporarily unavailable. Try again.');
  });

  it('shows only the authenticated human own answer after their agent responds', async () => {
    const response = await createApp({
      authentication: authentication('answerer'),
      repository: createInMemoryQuestionRepository({
        question: openQuestion,
        answers: [
          createAnswer({ userId: 'answerer', body: 'MY_OWN_ANSWER', excerpt: 'MY_OWN_EXCERPT' }),
          createAnswer({
            id: 'other-answer',
            userId: 'other-user',
            body: 'OTHER_ANSWER_SECRET',
            excerpt: 'OTHER_EXCERPT_SECRET',
          }),
        ],
      }),
      now: () => 99,
    }).request('http://example.test/questions/question-1');
    const html = await response.text();

    expect(html).toContain('Answers submitted: 2');
    expect(html).toContain('Your agent has answered.');
    expect(html).toContain('data-submission-status="answered"');
    expect(html).toContain('Your answer remains sealed until the deadline.');
    expect(html).toContain('MY_OWN_ANSWER');
    expect(html).toContain('MY_OWN_EXCERPT');
    expect(html).not.toContain('data-agent-request-prompt');
    expect(html).not.toContain('OTHER_ANSWER_SECRET');
    expect(html).not.toContain('OTHER_EXCERPT_SECRET');
  });

  it('keeps only the authenticated human own answer visible after submissions close', async () => {
    const response = await createApp({
      authentication: authentication('answerer'),
      repository: createInMemoryQuestionRepository({
        question: closedQuestion,
        answers: [
          createAnswer({
            userId: 'answerer',
            body: 'MY_CLOSED_ANSWER',
            excerpt: 'MY_CLOSED_EXCERPT',
          }),
          createAnswer({
            id: 'other-closed-answer',
            userId: 'other-user',
            body: 'OTHER_CLOSED_ANSWER_SECRET',
            excerpt: 'OTHER_CLOSED_EXCERPT_SECRET',
          }),
        ],
      }),
      now: () => 100,
    }).request('http://example.test/questions/question-1');
    const html = await response.text();

    expect(html).toContain('data-submission-status="answered"');
    expect(html).toContain('MY_CLOSED_ANSWER');
    expect(html).toContain('MY_CLOSED_EXCERPT');
    expect(html).not.toContain('OTHER_CLOSED_ANSWER_SECRET');
    expect(html).not.toContain('OTHER_CLOSED_EXCERPT_SECRET');
  });

  it('marks the authenticated participant own answer in revealed results', async () => {
    const response = await createApp({
      authentication: authentication('answerer'),
      repository: createInMemoryQuestionRepository({
        question: openQuestion,
        answers: [
          createAnswer({ id: 'mine', userId: 'answerer', excerpt: 'MY_PUBLIC_EXCERPT' }),
          createAnswer({ id: 'theirs', userId: 'other-user', excerpt: 'OTHER_PUBLIC_EXCERPT' }),
        ],
      }),
      now: () => 100,
    }).request('http://example.test/questions/question-1');
    const html = await response.text();

    expect(html).toContain('data-submission-status="answered"');
    expect(html.match(/data-own-answer-badge/g)).toHaveLength(1);
    expect(html).toContain('Your answer');
    expect(html).not.toContain('userId');
    expect(html).not.toContain('answerer');
  });

  it('reflects zero, one, and multiple answers on reload', async () => {
    const counts = [];
    for (const answers of [
      [],
      [createAnswer({ userId: 'first-user' })],
      [
        createAnswer({ userId: 'first-user' }),
        createAnswer({ id: 'answer-2', userId: 'second-user' }),
      ],
    ]) {
      const response = await createApp({
        authentication: authentication('viewer'),
        repository: createInMemoryQuestionRepository({ question: openQuestion, answers }),
        now: () => 99,
      }).request('http://example.test/questions/question-1');
      counts.push((await response.text()).match(/Answers submitted: (\d+)/)?.[1]);
    }
    expect(counts).toEqual(['0', '1', '2']);
  });

  it('does not misrepresent a failed submission lookup as unsubmitted', async () => {
    const repository = {
      ...createInMemoryQuestionRepository({
        question: openQuestion,
        answers: [createAnswer({ userId: 'answerer', body: 'LOOKUP_PRIVATE_ANSWER' })],
      }),
      getOwnAnswer: vi.fn().mockRejectedValue(new Error('unavailable')),
    } satisfies QuestionRepository;
    const response = await createApp({
      authentication: authentication('answerer'),
      repository,
      now: () => 99,
    }).request('http://example.test/questions/question-1');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Your submission status is temporarily unavailable. Try again.');
    expect(html).not.toContain('data-submission-status');
    expect(html).not.toContain('data-agent-request-prompt');
    expect(html).not.toContain('LOOKUP_PRIVATE_ANSWER');
  });

  it('uses the same private-safe state when identity verification fails', async () => {
    const failingAuthentication: Authentication = {
      getSession: vi.fn().mockRejectedValue(new Error('unavailable')),
      handle: vi.fn(),
    };
    const response = await createApp({
      authentication: failingAuthentication,
      repository: createInMemoryQuestionRepository({ question: openQuestion }),
      now: () => 99,
    }).request('http://example.test/questions/question-1');
    const html = await response.text();

    expect(html).toContain('Your submission status is temporarily unavailable. Try again.');
    expect(html).not.toContain('data-agent-request-prompt');
    expect(html).toContain('id="google-sign-in"');
  });

  it('provides stable state hooks for the Challenge visual layer', async () => {
    const html = await (
      await appFor({ userId: 'new-user' }).request('http://example.test/questions/question-1')
    ).text();

    expect(html).toContain('data-page="question-detail"');
    expect(html).toContain('data-site-header');
    expect(html).toContain('big-question-club-logo.svg');
    expect(html).toContain('data-question-state="OPEN"');
    expect(html).toContain('data-question-detail');
    expect(html).toContain('data-answer-count');
    expect(html).toContain('data-time-remaining');
    expect(html).toContain('data-sealed-status');
    expect(html).toContain('data-agent-request');
  });
});
