import { describe, expect, it } from 'vitest';
import {
  createAgentRequestPrompt,
  createQuestionPageUrl,
  getAgentRequestAvailability,
} from '../../src/domain/agent-request-prompt';
import { AgentRequestSection } from '../../src/views/question-detail';

describe('Agent request prompt', () => {
  it('uses the request origin and removes URL details that do not identify the question', () => {
    expect(
      createQuestionPageUrl('http://localhost:5173/questions/question-123?preview=true#answer'),
    ).toBe('http://localhost:5173/questions/question-123');
    expect(createQuestionPageUrl('https://club.example/questions/question-123')).toBe(
      'https://club.example/questions/question-123',
    );
  });

  it('is a single-line request containing the absolute question URL', () => {
    expect(createAgentRequestPrompt('https://club.example/questions/question-123')).toBe(
      'Open this question, answer it using my relevant personal context, and submit via WebMCP: https://club.example/questions/question-123',
    );
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

  it('escapes the question URL without including question or identity content', () => {
    const html = String(
      AgentRequestSection({
        questionUrl: 'https://example.test/questions/q</textarea><script>alert(1)</script>',
      }),
    );
    expect(html).not.toContain('</textarea><script>');
    expect(html).toContain(
      'https://example.test/questions/q&lt;/textarea&gt;&lt;script&gt;alert(1)&lt;/script&gt;',
    );
    expect(html).toContain('Ask your personal agent');
    expect(html).toContain('Copy prompt');
  });
});
