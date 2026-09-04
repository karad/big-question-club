export type AuthenticationControlState = 'signed-in' | 'signed-out' | 'unavailable';

export type AuthenticationControlPresentation = {
  showSignIn: boolean;
  showSignOut: boolean;
  statusMessage: string;
};

/**
 * Maps authentication state to header-control visibility and status text.
 * @param state - Current authentication state.
 * @returns The presentation model for authentication controls.
 */
export function getAuthenticationControlPresentation(
  state: AuthenticationControlState,
): AuthenticationControlPresentation {
  if (state === 'signed-in') {
    return { showSignIn: false, showSignOut: true, statusMessage: '' };
  }
  if (state === 'signed-out') {
    return { showSignIn: true, showSignOut: false, statusMessage: '' };
  }
  return {
    showSignIn: true,
    showSignOut: false,
    statusMessage: 'Identity verification is temporarily unavailable.',
  };
}
