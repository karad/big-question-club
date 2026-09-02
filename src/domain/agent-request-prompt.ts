export function createQuestionPageUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  url.search = '';
  url.hash = '';
  return url.href;
}

export function createAgentRequestPrompt(questionUrl: string): string {
  return `Open this question, answer it using my relevant personal context, and submit via WebMCP: ${questionUrl}`;
}

export type AgentRequestAvailability = 'available' | 'sign-in' | 'already-submitted' | 'closed';

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
