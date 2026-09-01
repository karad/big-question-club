import { Hono } from 'hono';

import type { Authentication } from './auth/session';
import { authenticationRoute } from './routes/auth';
import { healthRoute } from './routes/health';
import { verificationQuestionRoute } from './routes/verification-question';
import { whoAmIRoute } from './routes/who-am-i';
import { VERIFICATION_TOOL_NAME } from './webmcp/register-tool';
import { WHO_AM_I_TOOL_NAME } from './webmcp/register-who-am-i-tool';

export function createApp({
  authentication,
  clientScriptUrl = '/client.js',
}: {
  authentication?: Authentication;
  clientScriptUrl?: string;
} = {}): Hono {
  const app = new Hono();

  app.onError((error, context) => {
    console.error(error);
    return context.json({ error: 'Internal server error' }, 500);
  });

  app.get('/health', healthRoute);
  app.get('/api/verification-question', verificationQuestionRoute);
  app.all('/api/auth/*', (context) => authenticationRoute(context, authentication));
  app.get('/api/who-am-i', (context) => whoAmIRoute(context, authentication));
  app.get('/', (context) => context.html(<VerificationPage clientScriptUrl={clientScriptUrl} />));

  return app;
}

function VerificationPage({ clientScriptUrl }: { clientScriptUrl: string }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Big Question Club — WebMCP check</title>
      </head>
      <body>
        <main>
          <h1>WebMCP connection check</h1>
          <p>
            This page registers <code>{VERIFICATION_TOOL_NAME}</code> for a personal agent.
          </p>
          <p>
            Sign in with Google, then ask your personal agent to run{' '}
            <code>{WHO_AM_I_TOOL_NAME}</code>.
          </p>
          <button id="google-sign-in" type="button">
            Sign in with Google
          </button>
          <button id="sign-out" type="button" hidden>
            Sign out
          </button>
          <p id="identity-status" role="status">
            Checking authentication status…
          </p>
          <p id="webmcp-status" role="status">
            Checking WebMCP support…
          </p>
        </main>
        <script type="module" src={clientScriptUrl} />
      </body>
    </html>
  );
}
