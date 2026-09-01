import { registerVerificationQuestionTool } from './webmcp/register-tool';
import { registerWhoAmITool } from './webmcp/register-who-am-i-tool';

const statusElement = document.getElementById('webmcp-status');
const identityStatusElement = document.getElementById('identity-status');
const signInButton = document.getElementById('google-sign-in');
const signOutButton = document.getElementById('sign-out');

function updateStatus(message: string): void {
  if (statusElement !== null) {
    statusElement.textContent = message;
  }
}

function updateIdentityStatus(message: string): void {
  if (identityStatusElement !== null) {
    identityStatusElement.textContent = message;
  }
}

function updateAuthenticationControls(isAuthenticated: boolean): void {
  signInButton?.toggleAttribute('hidden', isAuthenticated);
  signOutButton?.toggleAttribute('hidden', !isAuthenticated);
}

void registerVerificationQuestionTool(document, fetch).then((registration) => {
  if (registration.registered) {
    updateStatus(
      'WebMCP tool registered. Use your personal agent to retrieve the verification question.',
    );
    return;
  }

  updateStatus(registration.message);
});

void registerWhoAmITool(document, fetch).then((registration) => {
  if (!registration.registered) {
    updateStatus(registration.message);
  }
});

void fetch('/api/who-am-i', { headers: { Accept: 'application/json' } }).then(async (response) => {
  if (response.status === 401) {
    updateAuthenticationControls(false);
    updateIdentityStatus('Sign in to identify your account.');
    return;
  }

  if (!response.ok) {
    updateAuthenticationControls(false);
    updateIdentityStatus('Identity verification is temporarily unavailable.');
    return;
  }

  const payload = (await response.json()) as { userId?: unknown };
  if (typeof payload.userId === 'string') {
    updateAuthenticationControls(true);
    updateIdentityStatus(`Signed in as ${payload.userId}.`);
    return;
  }

  updateAuthenticationControls(false);
  updateIdentityStatus('Identity verification is temporarily unavailable.');
});

signInButton?.addEventListener('click', async () => {
  const response = await fetch('/api/auth/sign-in/social', {
    body: JSON.stringify({ callbackURL: '/', provider: 'google' }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  const payload = (await response.json()) as { url?: unknown };

  if (typeof payload.url === 'string') {
    window.location.assign(payload.url);
    return;
  }

  updateIdentityStatus('Sign-in could not be started.');
});

signOutButton?.addEventListener('click', async () => {
  const response = await fetch('/api/auth/sign-out', {
    body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (response.ok) {
    window.location.reload();
    return;
  }

  updateIdentityStatus('Sign-out could not be completed.');
});
