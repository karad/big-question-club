export type AccessPath = 'ssr' | 'api' | 'webmcp' | 'detail';
export function canReadOtherAnswerBody(
  isAuthenticated: boolean,
  path: AccessPath,
  isRevealed: boolean,
): boolean {
  return isAuthenticated && isRevealed && path === 'detail';
}
export function canListAnswerExcerpts(isAuthenticated: boolean, isRevealed: boolean): boolean {
  return isAuthenticated && isRevealed;
}
