import type { QuestionState } from './question';

export type AnswerAccessPath = 'human-ssr' | 'human-detail' | 'self-submission' | 'webmcp';
export type AnswerResource = 'answer-count' | 'own-answer' | 'other-excerpts' | 'other-body';
export type AnswerAccessContext = {
  authenticated: boolean;
  path: AnswerAccessPath;
  resource: AnswerResource;
  state: QuestionState;
};

export function canAccessAnswerResource({
  authenticated,
  path,
  resource,
  state,
}: AnswerAccessContext): boolean {
  if (!authenticated || state === 'DRAFT') return false;
  if (resource === 'answer-count') return path === 'human-ssr';
  if (resource === 'own-answer') {
    return path === 'self-submission' || (path === 'human-ssr' && state !== 'REVEALED');
  }
  if (state !== 'REVEALED') return false;
  if (resource === 'other-excerpts') return path === 'human-ssr';
  return path === 'human-detail';
}

export type AccessPath = 'ssr' | 'api' | 'webmcp' | 'detail';
export function canReadOtherAnswerBody(
  isAuthenticated: boolean,
  path: AccessPath,
  state: QuestionState,
): boolean {
  return canAccessAnswerResource({
    authenticated: isAuthenticated,
    path: path === 'detail' ? 'human-detail' : path === 'webmcp' ? 'webmcp' : 'human-ssr',
    resource: 'other-body',
    state,
  });
}
export function canListAnswerExcerpts(isAuthenticated: boolean, state: QuestionState): boolean {
  return canAccessAnswerResource({
    authenticated: isAuthenticated,
    path: 'human-ssr',
    resource: 'other-excerpts',
    state,
  });
}
