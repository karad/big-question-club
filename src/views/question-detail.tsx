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

export function renderOwnAnswer(answer: { body: string; excerpt: string }): string {
  return `<section><h2>Your answer</h2><p>${escapeHtml(answer.excerpt)}</p><p>${escapeHtml(answer.body)}</p></section>`;
}

export function renderRevealedAnswers(answers: Array<{ id: string; excerpt: string }>): string {
  if (answers.length === 0) return '<li>No answers have been submitted.</li>';
  return answers
    .map(
      ({ id, excerpt }) =>
        `<li><button type="button" data-answer-id="${escapeHtml(id)}">${escapeHtml(excerpt)}</button><p id="answer-${escapeHtml(id)}" hidden></p></li>`,
    )
    .join('');
}
