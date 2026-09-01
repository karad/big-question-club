import { registerVerificationQuestionTool } from './webmcp/register-tool';
import { registerWhoAmITool } from './webmcp/register-who-am-i-tool';
import { registerSubmitAnswerTool } from './webmcp/register-submit-answer-tool';
import { registerMySubmissionTool } from './webmcp/register-my-submission-tool';

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

async function registerWebMcpTools(): Promise<void> {
  const registrations = [
    await registerVerificationQuestionTool(document, fetch),
    await registerWhoAmITool(document, fetch),
    await registerSubmitAnswerTool(document, fetch),
    await registerMySubmissionTool(document, fetch),
  ];
  const failedRegistration = registrations.find((registration) => !registration.registered);
  if (failedRegistration !== undefined && !failedRegistration.registered) {
    updateStatus(failedRegistration.message);
    return;
  }
  updateStatus('WebMCP tools registered. Use your personal agent to retrieve or submit an answer.');
}

void registerWebMcpTools();

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const answerId = target.dataset.answerId;
  if (answerId === undefined) return;
  const questionId = window.location.pathname.split('/').at(-1);
  if (questionId === undefined || questionId.length === 0) return;
  void fetch(
    `/api/questions/${encodeURIComponent(questionId)}/answers/${encodeURIComponent(answerId)}`,
    {
      headers: { Accept: 'application/json' },
    },
  ).then(async (response) => {
    if (!response.ok) return;
    const payload = (await response.json()) as { body?: unknown };
    if (typeof payload.body !== 'string') return;
    const bodyElement = document.getElementById(`answer-${answerId}`);
    if (bodyElement !== null) {
      bodyElement.textContent = payload.body;
      bodyElement.hidden = false;
    }
  });
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
