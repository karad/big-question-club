import type { QuestionState } from './question';

export type AccessPath = 'ssr' | 'api' | 'webmcp' | 'detail';
export function canReadOtherAnswerBody(
  isAuthenticated: boolean,
  path: AccessPath,
  state: QuestionState,
): boolean {
  return isAuthenticated && state === 'REVEALED' && path === 'detail';
}
export function canListAnswerExcerpts(isAuthenticated: boolean, state: QuestionState): boolean {
  return isAuthenticated && state === 'REVEALED';
}
