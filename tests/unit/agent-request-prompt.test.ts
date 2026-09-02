import { describe, expect, it } from 'vitest';
import {
  createAgentRequestPrompt,
  getAgentRequestAvailability,
} from '../../src/domain/agent-request-prompt';
import { renderAgentRequestSection } from '../../src/views/question-detail';

describe('Agent request prompt', () => {
  it('matches the fixed contract and varies only by opaque question id', () => {
    const prompt = createAgentRequestPrompt('question-123');
    expect(prompt).toContain('Question ID: question-123');
    expect(prompt).toContain('Call get_question with this exact Question ID');
    expect(prompt).toContain('Submit them once with submit_answer');
    expect(prompt).toContain('Call get_my_submission for this exact Question ID');
    expect(prompt).not.toContain('update_answer');
    expect(prompt).not.toContain('remove_answer');
  });

  it('derives display availability without question content', () => {
    expect(
      getAgentRequestAvailability({ authenticated: false, open: true, submitted: false }),
    ).toBe('sign-in');
    expect(
      getAgentRequestAvailability({ authenticated: true, open: false, submitted: false }),
    ).toBe('closed');
    expect(getAgentRequestAvailability({ authenticated: true, open: true, submitted: true })).toBe(
      'already-submitted',
    );
    expect(getAgentRequestAvailability({ authenticated: true, open: true, submitted: false })).toBe(
      'available',
    );
  });

  it('escapes an opaque id without including question or identity content', () => {
    const html = renderAgentRequestSection('q</textarea><script>alert(1)</script>');
    expect(html).not.toContain('</textarea><script>');
    expect(html).toContain('q&lt;/textarea&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('Ask your personal agent');
    expect(html).toContain('Copy prompt');
  });
});
