import type { QuestionState } from './question';

export type AnswerAccessPath = 'human-ssr' | 'human-detail' | 'self-submission' | 'webmcp';
export type AnswerResource = 'answer-count' | 'own-answer' | 'other-excerpts' | 'other-body';
export type AnswerAccessContext = {
  authenticated: boolean;
  path: AnswerAccessPath;
  resource: AnswerResource;
  state: QuestionState;
};

/**
 * Applies answer-visibility rules for a resource and access path.
 * @param context - Viewer authentication, access path, resource, and question state.
 * @returns True when the requested resource may be exposed.
 */
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
/**
 * Checks whether another participant's full answer may be read.
 * @param isAuthenticated - Whether the viewer has a valid identity.
 * @param path - Route or tool used to access the answer.
 * @param state - Current lifecycle state of the question.
 * @returns True when full answer access is permitted.
 */
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
/**
 * Checks whether revealed answer excerpts may be listed.
 * @param isAuthenticated - Whether the viewer has a valid identity.
 * @param state - Current lifecycle state of the question.
 * @returns True when excerpts are visible.
 */
export function canListAnswerExcerpts(isAuthenticated: boolean, state: QuestionState): boolean {
  return canAccessAnswerResource({
    authenticated: isAuthenticated,
    path: 'human-ssr',
    resource: 'other-excerpts',
    state,
  });
}
