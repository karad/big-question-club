import type { AnswerAccessPath, AnswerResource } from '../../src/domain/answer-visibility';
import type { QuestionState } from '../../src/domain/question';

export const visibilityPrincipals = [
  { authenticated: false, name: 'unauthenticated' },
  { authenticated: true, name: 'question-creator' },
  { authenticated: true, name: 'answer-owner' },
  { authenticated: true, name: 'other-human' },
  { authenticated: true, name: 'personal-agent' },
] as const;
export const visibilityStates = ['DRAFT', 'OPEN', 'CLOSED', 'REVEALED'] as const;
export const visibilityPaths = ['human-ssr', 'human-detail', 'self-submission', 'webmcp'] as const;
export const visibilityResources = [
  'answer-count',
  'own-answer',
  'other-excerpts',
  'other-body',
] as const;

export type VisibilityCase = {
  authenticated: boolean;
  expected: boolean;
  label: string;
  path: AnswerAccessPath;
  resource: AnswerResource;
  state: QuestionState;
};

function expectedAccess(
  authenticated: boolean,
  path: AnswerAccessPath,
  resource: AnswerResource,
  state: QuestionState,
): boolean {
  if (!authenticated || state === 'DRAFT') return false;
  if (resource === 'answer-count') return path === 'human-ssr';
  if (resource === 'own-answer') {
    return path === 'self-submission' || (path === 'human-ssr' && state !== 'REVEALED');
  }
  if (resource === 'other-excerpts') return path === 'human-ssr' && state === 'REVEALED';
  return path === 'human-detail' && state === 'REVEALED';
}

export const visibilityCases: VisibilityCase[] = visibilityPrincipals.flatMap((principal) =>
  visibilityStates.flatMap((state) =>
    visibilityPaths.flatMap((path) =>
      visibilityResources.map((resource) => ({
        authenticated: principal.authenticated,
        expected: expectedAccess(principal.authenticated, path, resource, state),
        label: `${principal.name} ${state} ${path} ${resource}`,
        path,
        resource,
        state,
      })),
    ),
  ),
);
