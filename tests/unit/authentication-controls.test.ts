import { describe, expect, it } from 'vitest';
import { getAuthenticationControlPresentation } from '../../src/ui/authentication-controls';

describe('authentication control presentation', () => {
  it('shows sign in without redundant status text while signed out', () => {
    expect(getAuthenticationControlPresentation('signed-out')).toEqual({
      showSignIn: true,
      showSignOut: false,
      statusMessage: '',
    });
  });

  it('uses the sign-out action alone to communicate authenticated state', () => {
    expect(getAuthenticationControlPresentation('signed-in')).toEqual({
      showSignIn: false,
      showSignOut: true,
      statusMessage: '',
    });
  });

  it('keeps recovery available when identity verification fails', () => {
    expect(getAuthenticationControlPresentation('unavailable')).toEqual({
      showSignIn: true,
      showSignOut: false,
      statusMessage: 'Identity verification is temporarily unavailable.',
    });
  });
});
