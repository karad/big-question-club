import { describe, expect, it } from 'vitest';

import { VERIFICATION_QUESTION } from '../../src/domain/verification-question';
import { createApp } from '../../src/app';

describe('GET /api/verification-question', () => {
  it('returns the fixed verification question', async () => {
    const response = await createApp().request('/api/verification-question');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ kind: 'question', ...VERIFICATION_QUESTION });
  });

  it('does not require authentication cookies', async () => {
    const response = await createApp().request('/api/verification-question', {
      headers: { cookie: '' },
    });

    expect(response.status).toBe(200);
  });
});
