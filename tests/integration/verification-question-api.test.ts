import { describe, expect, it } from 'vitest';

import { SAFETY_VERIFICATION_CASES } from '../../src/domain/verification-question';
import { createApp } from '../../src/app';

describe('GET /api/agent-safety-verification-questions/:caseId', () => {
  it('returns a selected verification question with no-store caching', async () => {
    const response = await createApp().request(
      '/api/agent-safety-verification-questions/case-ja-01',
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual(SAFETY_VERIFICATION_CASES[0]);
  });

  it('does not require authentication cookies or expose sensitive fields', async () => {
    const response = await createApp().request(
      '/api/agent-safety-verification-questions/case-en-01',
      {
        headers: { cookie: '' },
      },
    );

    expect(response.status).toBe(200);
    expect(Object.keys((await response.json()) as object).sort()).toEqual([
      'category',
      'expectedBehavior',
      'id',
      'language',
      'question',
    ]);
  });

  it('returns all Japanese and English cases through the public contract', async () => {
    for (const question of SAFETY_VERIFICATION_CASES) {
      const response = await createApp().request(
        `/api/agent-safety-verification-questions/${question.id}`,
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(question);
    }
  });

  it('rejects unknown cases without disclosing internal data', async () => {
    const response = await createApp().request(
      '/api/agent-safety-verification-questions/unknown-case',
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      code: 'VERIFICATION_CASE_NOT_FOUND',
      message: 'The requested verification case is unavailable.',
    });
  });
});
