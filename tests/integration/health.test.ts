import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app';

describe('GET /health', () => {
  it('returns an OK health response', async () => {
    const response = await createApp().request('/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });
});
