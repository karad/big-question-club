import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app';

describe('GET /', () => {
  it('renders the safety verification page and the WebMCP tool names', async () => {
    const response = await createApp().request('/');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('Personal agent safety verification');
    expect(html).toContain('get_agent_safety_verification_question');
    expect(html).toContain('who_am_i');
    expect(html).toContain('Sign in with Google');
    expect(html).toContain('Sign out');
    expect(html).toContain('<script type="module" src="/client.js"></script>');
  });

  it('does not render questions, answers, or private context before browser registration', async () => {
    const response = await createApp().request('/');
    const html = await response.text();

    expect(html).toContain('Checking WebMCP support…');
    expect(html).not.toContain('Question retrieved successfully');
    expect(html).not.toContain('Private Context');
    expect(html).not.toContain('Answer submitted');
  });
});
