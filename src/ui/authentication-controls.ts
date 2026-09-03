export type AuthenticationControlState = 'signed-in' | 'signed-out' | 'unavailable';

export type AuthenticationControlPresentation = {
  showSignIn: boolean;
  showSignOut: boolean;
  statusMessage: string;
};

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
