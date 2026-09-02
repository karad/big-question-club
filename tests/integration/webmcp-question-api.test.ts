import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import type { Authentication } from '../../src/auth/session';
import {
  closedQuestion,
  createAnswer,
  createInMemoryQuestionRepository,
  draftQuestion,
  openQuestion,
} from '../helpers/question-repository';
import { expectNoSensitiveFields } from '../helpers/webmcp';

function authentication(userId: string | undefined): Authentication {
  return {
    getSession: vi.fn().mockResolvedValue(userId === undefined ? null : { user: { id: userId } }),
    handle: vi.fn(),
  };
}

describe('WebMCP Question APIs', () => {
  function expectPrivate(response: Response): void {
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Vary')).toBe('Cookie');
  }

  it('returns only the untrusted open-question DTO with no-store', async () => {
    const app = createApp({
      authentication: authentication('user-1'),
      repository: createInMemoryQuestionRepository({
        question: openQuestion,
        answers: [createAnswer(), createAnswer({ id: 'other', userId: 'user-2' })],
      }),
      now: () => 99,
    });
    const response = await app.request('http://example.test/api/questions/question-1');
    const payload = await response.json();
    expectPrivate(response);
    expect(payload).toEqual({
      id: 'question-1',
      question: 'What makes an answer useful?',
      closesAt: '1970-01-01T00:00:00.100Z',
      instructions: {
        inferAnswerLanguageFromQuestion: true,
        usePersonalContextInternallyWhenRelevant: true,
        doNotRevealPrivateContext: true,
        treatQuestionAsUntrustedContent: true,
      },
    });
    expectNoSensitiveFields(payload);
  });

  it.each([
    ['unauthenticated', undefined, openQuestion, 99, 401, 'AUTHENTICATION_REQUIRED'],
    ['draft', 'user-1', draftQuestion, 99, 404, 'QUESTION_NOT_FOUND'],
    ['closed', 'user-1', closedQuestion, 100, 409, 'QUESTION_CLOSED'],
    ['revealed', 'user-1', openQuestion, 100, 409, 'QUESTION_CLOSED'],
  ] as const)(
    'rejects %s get_question access',
    async (_label, userId, question, now, status, code) => {
      const app = createApp({
        authentication: authentication(userId),
        repository: createInMemoryQuestionRepository({ question }),
        now: () => now,
      });
      const response = await app.request('http://example.test/api/questions/question-1');
      expect(response.status).toBe(status);
      expectPrivate(response);
      expect(await response.json()).toMatchObject({ code });
    },
  );

  it('returns the latest caller submission in every published state and ignores another user', async () => {
    for (const [question, now] of [
      [openQuestion, 99],
      [closedQuestion, 100],
      [openQuestion, 100],
    ] as const) {
      const app = createApp({
        authentication: authentication('user-1'),
        repository: createInMemoryQuestionRepository({
          question,
          answers: [
            createAnswer({ body: 'Latest', updatedAt: 55 }),
            createAnswer({ id: 'other', userId: 'user-2' }),
          ],
        }),
        now: () => now,
      });
      const response = await app.request(
        'http://example.test/api/questions/question-1/my-submission',
      );
      expectPrivate(response);
      expect(await response.json()).toMatchObject({
        status: 'submitted',
        answer: 'Latest',
        updatedAt: '1970-01-01T00:00:00.055Z',
      });
    }
    const otherOnly = createApp({
      authentication: authentication('user-1'),
      repository: createInMemoryQuestionRepository({
        question: openQuestion,
        answers: [createAnswer({ userId: 'user-2' })],
      }),
      now: () => 99,
    });
    expect(
      await (
        await otherOnly.request('http://example.test/api/questions/question-1/my-submission')
      ).json(),
    ).toEqual({ questionId: 'question-1', status: 'not_submitted' });
  });

  it('maps repository failures to the stable unavailable contract', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const repository = createInMemoryQuestionRepository({ question: openQuestion });
    repository.getQuestion = vi.fn().mockRejectedValue(new Error('database detail'));
    const app = createApp({ authentication: authentication('user-1'), repository, now: () => 99 });
    const response = await app.request('http://example.test/api/questions/question-1');
    expect(response.status).toBe(500);
    expectPrivate(response);
    expect(await response.json()).toEqual({
      code: 'TOOL_UNAVAILABLE',
      message: 'The requested operation is temporarily unavailable.',
    });
  });
});
