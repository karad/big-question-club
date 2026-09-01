import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app';

describe('GET /', () => {
  it('renders the verification page and the WebMCP tool name', async () => {
    const response = await createApp().request('/');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('WebMCP connection check');
    expect(html).toContain('get_verification_question');
    expect(html).toContain('<script type="module" src="/client.js"></script>');
  });

  it('does not render a question success state before browser registration', async () => {
    const response = await createApp().request('/');
    const html = await response.text();

    expect(html).toContain('Checking WebMCP support…');
    expect(html).not.toContain('Question retrieved successfully');
  });
});
