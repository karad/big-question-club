import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/app';

describe('GET /api/who-am-i', () => {
  it('returns only the authenticated user identifier', async () => {
    const response = await createApp({
      authentication: {
        getSession: vi.fn().mockResolvedValue({ user: { id: 'user-123' } }),
        handle: vi.fn(),
      },
    }).request('/api/who-am-i');

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ userId: 'user-123' });
  });

  it('does not identify an unauthenticated or invalid session', async () => {
    const response = await createApp({
      authentication: {
        getSession: vi.fn().mockResolvedValue(null),
        handle: vi.fn(),
      },
    }).request('/api/who-am-i', { headers: { cookie: 'invalid-session' } });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Sign in to identify your account.',
    });
  });
});
