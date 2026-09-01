import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app';

describe('authentication route', () => {
  it('returns a safe error before authentication is configured', async () => {
    const response = await createApp().request('/api/auth/sign-in/social', { method: 'POST' });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      code: 'IDENTITY_UNAVAILABLE',
      message: 'Identity verification is temporarily unavailable.',
    });
  });
});
