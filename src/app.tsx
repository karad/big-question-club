import { Hono } from 'hono';

import { healthRoute } from './routes/health';
import { verificationQuestionRoute } from './routes/verification-question';
import { VERIFICATION_TOOL_NAME } from './webmcp/register-tool';

export function createApp(clientScriptUrl = '/client.js'): Hono {
  const app = new Hono();

  app.onError((error, context) => {
    console.error(error);
    return context.json({ error: 'Internal server error' }, 500);
  });

  app.get('/health', healthRoute);
  app.get('/api/verification-question', verificationQuestionRoute);
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
          <p id="webmcp-status" role="status">
            Checking WebMCP support…
          </p>
        </main>
        <script type="module" src={clientScriptUrl} />
      </body>
    </html>
  );
}
