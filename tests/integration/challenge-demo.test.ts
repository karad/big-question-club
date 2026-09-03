import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import type { Authentication } from '../../src/auth/session';
import {
  createAnswer,
  createInMemoryQuestionRepository,
  openQuestion,
} from '../helpers/question-repository';

describe('three-minute challenge path', () => {
  it('connects home discovery, sealed counts, reveal excerpts, and lazy comparison', async () => {
    const authentication: Authentication = {
      getSession: vi.fn().mockResolvedValue({ user: { id: 'viewer' } }),
      handle: vi.fn(),
    };
    const question = { ...openQuestion, closesAt: 100, revealsAt: 100 };
    const answers = [
      createAnswer({
        id: 'answer-a',
        userId: 'a',
        body: 'DEMO_BODY_A',
        excerpt: 'First independent view.',
        createdAt: 10,
      }),
      createAnswer({
        id: 'answer-b',
        userId: 'b',
        body: 'DEMO_BODY_B',
        excerpt: 'Second independent view.',
        createdAt: 11,
      }),
    ];
    const app = createApp({
      authentication,
      repository: createInMemoryQuestionRepository({ question, answers }),
      now: () => 100,
    });
    const home = await (await app.request('http://example.test/')).text();
    expect(home).toContain('Results');
    const detail = await (await app.request('http://example.test/questions/question-1')).text();
    expect(detail).toContain('Results available');
    expect(detail).toContain(
      'All answers were submitted by signed-in participants. One answer per account.',
    );
    expect(detail.match(/Authenticated participant/g)).toHaveLength(2);
    expect(detail.match(/data-anonymous-participant-icon/g)).toHaveLength(2);
    expect(detail).toContain('Answer 1');
    expect(detail).toContain('Answer 2');
    expect(detail).toContain('First independent view.');
    expect(detail).not.toContain('DEMO_BODY_A');
    expect(detail).not.toContain('DEMO_BODY_B');
  });
});
