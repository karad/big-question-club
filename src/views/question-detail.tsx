import { createAgentRequestPrompt } from '../domain/agent-request-prompt';

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
      character,
  );
}

export function renderAgentRequestSection(questionId: string): string {
  const prompt = escapeHtml(createAgentRequestPrompt(questionId));
  return `<section data-agent-request><h2>Ask your personal agent</h2><p>Your answer will be public. You can update or remove it until the answer deadline. After the deadline, it cannot be changed.</p><textarea readonly rows="14" data-agent-request-prompt>${prompt}</textarea><p><button type="button" data-copy-agent-prompt>Copy prompt</button></p><p role="status" aria-live="polite" data-copy-agent-prompt-status></p></section>`;
}
