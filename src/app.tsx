import { Hono } from 'hono';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';

import type { Authentication } from './auth/session';
import { authenticationRoute } from './routes/auth';
import { healthRoute } from './routes/health';
import { verificationQuestionRoute } from './routes/verification-question';
import { whoAmIRoute } from './routes/who-am-i';
import { SAFETY_VERIFICATION_TOOL_NAME } from './webmcp/register-tool';
import { WHO_AM_I_TOOL_NAME } from './webmcp/register-who-am-i-tool';
import type { QuestionRepository } from './repositories/question-repository';
import { submitAnswerRoute } from './routes/submit-answer';
import {
  answerDetailRoute,
  mySubmissionRoute,
  questionPageRoute,
  questionRoute,
} from './routes/question';
import {
  createQuestionRoute,
  editQuestionPageRoute,
  myQuestionsRoute,
  newQuestionPageRoute,
  publishQuestionRoute,
  reviewQuestionRoute,
  updateQuestionRoute,
} from './routes/question-management';

export function createApp({
  authentication,
  clientScriptUrl = '/client.js',
  repository,
  now,
}: {
  authentication?: Authentication;
  clientScriptUrl?: string;
  repository?: QuestionRepository;
  now?: () => number;
} = {}): Hono {
  const app = new Hono();

  app.onError((error, context) => {
    if (error instanceof HTTPException) return error.getResponse();
    console.error(error);
    return context.json({ error: 'Internal server error' }, 500);
  });

  app.get('/health', healthRoute);
  app.get('/api/agent-safety-verification-questions/:caseId', verificationQuestionRoute);
  app.all('/api/auth/*', (context) => authenticationRoute(context, authentication));
  app.get('/api/who-am-i', (context) => whoAmIRoute(context, authentication));
  app.post('/api/questions/:questionId/answers', (context) =>
    submitAnswerRoute(context, authentication, repository, now ?? Date.now),
  );
  app.get('/api/questions/:questionId', (context) =>
    questionRoute(context, authentication, repository),
  );
  app.get('/api/questions/:questionId/my-submission', (context) =>
    mySubmissionRoute(context, authentication, repository),
  );
  app.get('/api/questions/:questionId/answers/:answerId', (context) =>
    answerDetailRoute(context, authentication, repository, now ?? Date.now),
  );
  app.get('/questions/new', (context) =>
    newQuestionPageRoute(context, authentication, clientScriptUrl),
  );
  app.post('/questions', csrf(), (context) =>
    createQuestionRoute(context, authentication, repository, now ?? Date.now, clientScriptUrl),
  );
  app.get('/my/questions', (context) =>
    myQuestionsRoute(context, authentication, repository, now ?? Date.now, clientScriptUrl),
  );
  app.get('/questions/:questionId/edit', (context) =>
    editQuestionPageRoute(context, authentication, repository, clientScriptUrl),
  );
  app.post('/questions/:questionId/edit', csrf(), (context) =>
    updateQuestionRoute(context, authentication, repository, now ?? Date.now, clientScriptUrl),
  );
  app.get('/questions/:questionId/review', (context) =>
    reviewQuestionRoute(context, authentication, repository, clientScriptUrl),
  );
  app.post('/questions/:questionId/publish', csrf(), (context) =>
    publishQuestionRoute(context, authentication, repository, now ?? Date.now, clientScriptUrl),
  );
  app.get('/questions/:questionId', (context) =>
    questionPageRoute(context, authentication, repository, now ?? Date.now, clientScriptUrl),
  );
  app.get('/', (context) => context.html(<VerificationPage clientScriptUrl={clientScriptUrl} />));

  return app;
}

function VerificationPage({ clientScriptUrl }: { clientScriptUrl: string }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Big Question Club — Personal agent safety verification</title>
      </head>
      <body>
        <main>
          <h1>Personal agent safety verification</h1>
          <p>
            This page registers <code>{SAFETY_VERIFICATION_TOOL_NAME}</code> for a personal agent.
          </p>
          <p>
            <a href="/questions/new">Create a question</a> <a href="/my/questions">My Questions</a>
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
