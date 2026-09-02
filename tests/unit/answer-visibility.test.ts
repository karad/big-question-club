import { describe, expect, it } from 'vitest';
import {
  canAccessAnswerResource,
  canListAnswerExcerpts,
  canReadOtherAnswerBody,
} from '../../src/domain/answer-visibility';
import { visibilityCases } from '../helpers/visibility-matrix';

describe('Answer visibility', () => {
  it.each(visibilityCases)('$label', ({ authenticated, expected, path, resource, state }) => {
    expect(canAccessAnswerResource({ authenticated, path, resource, state })).toBe(expected);
  });

  it('keeps creator status out of the access decision and exposes own bodies through self-submission after reveal', () => {
    expect(
      canAccessAnswerResource({
        authenticated: true,
        path: 'human-ssr',
        resource: 'other-body',
        state: 'OPEN',
      }),
    ).toBe(false);
    expect(
      canAccessAnswerResource({
        authenticated: true,
        path: 'self-submission',
        resource: 'own-answer',
        state: 'REVEALED',
      }),
    ).toBe(true);
    expect(
      canAccessAnswerResource({
        authenticated: true,
        path: 'human-ssr',
        resource: 'own-answer',
        state: 'REVEALED',
      }),
    ).toBe(false);
  });

  it('lists excerpts only for authenticated Humans in REVEALED', () => {
    expect(canListAnswerExcerpts(true, 'REVEALED')).toBe(true);
    expect(canListAnswerExcerpts(true, 'CLOSED')).toBe(false);
    expect(canListAnswerExcerpts(false, 'REVEALED')).toBe(false);
  });
  it('returns another Answer body only through the revealed detail path', () => {
    expect(canReadOtherAnswerBody(true, 'detail', 'REVEALED')).toBe(true);
    expect(canReadOtherAnswerBody(true, 'api', 'REVEALED')).toBe(false);
    expect(canReadOtherAnswerBody(true, 'detail', 'CLOSED')).toBe(false);
    expect(canReadOtherAnswerBody(false, 'detail', 'REVEALED')).toBe(false);
    expect(canReadOtherAnswerBody(true, 'webmcp', 'REVEALED')).toBe(false);
  });

  it('keeps all answer content unavailable until reveal for every principal and path', () => {
    for (const authenticated of [true, false]) {
      for (const state of ['DRAFT', 'OPEN', 'CLOSED'] as const) {
        expect(canListAnswerExcerpts(authenticated, state)).toBe(false);
        expect(canReadOtherAnswerBody(authenticated, 'detail', state)).toBe(false);
        expect(canReadOtherAnswerBody(authenticated, 'api', state)).toBe(false);
        expect(canReadOtherAnswerBody(authenticated, 'webmcp', state)).toBe(false);
      }
    }
  });
});
