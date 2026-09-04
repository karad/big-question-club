/**
 * Converts a request URL into the canonical public question-page URL.
 * @param requestUrl - URL of the current question request.
 * @returns The URL without query parameters or a fragment.
 */
export function createQuestionPageUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  url.search = '';
  url.hash = '';
  return url.href;
}

/**
 * Creates the prompt used to ask an agent to answer a question.
 * @param questionUrl - Public URL of the question page.
 * @returns A ready-to-copy English agent prompt.
 */
export function createAgentRequestPrompt(questionUrl: string): string {
  return `Use ChatGPT's built-in browser, not an existing Chrome tab, to open this question, answer it using my relevant personal context, and submit via WebMCP: ${questionUrl}`;
}

export type AgentRequestAvailability = 'available' | 'sign-in' | 'already-submitted' | 'closed';

/**
 * Determines whether the agent-request action can be shown.
 * @param options - Authentication, question openness, and submission state.
 * @returns The availability state for the action.
 */
export function getAgentRequestAvailability({
  authenticated,
  open,
  submitted,
}: {
  authenticated: boolean;
  open: boolean;
  submitted: boolean;
}): AgentRequestAvailability {
  if (!authenticated) return 'sign-in';
  if (!open) return 'closed';
  return submitted ? 'already-submitted' : 'available';
}
