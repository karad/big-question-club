import { Hono } from 'hono';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';

import type { Authentication } from './auth/session';
import { answerError } from './domain/answer-submission';
import { authenticationRoute } from './routes/auth';
import { healthRoute } from './routes/health';
import { verificationQuestionRoute } from './routes/verification-question';
import { whoAmIRoute } from './routes/who-am-i';
import type { QuestionRepository } from './repositories/question-repository';
import { submitAnswerRoute } from './routes/submit-answer';
import { removeAnswerRoute, updateAnswerRoute } from './routes/answer-mutation';
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
    if (context.req.path.startsWith('/api/questions/'))
      return context.json(answerError('TOOL_UNAVAILABLE'), 500, { 'Cache-Control': 'no-store' });
    return context.json({ error: 'Internal server error' }, 500);
  });

  app.get('/health', healthRoute);
  app.get('/api/agent-safety-verification-questions/:caseId', verificationQuestionRoute);
  app.all('/api/auth/*', (context) => authenticationRoute(context, authentication));
  app.get('/api/who-am-i', (context) => whoAmIRoute(context, authentication));
  app.post('/api/questions/:questionId/answers', (context) =>
    submitAnswerRoute(context, authentication, repository, now ?? Date.now),
  );
  app.put('/api/questions/:questionId/my-answer', (context) =>
    updateAnswerRoute(context, authentication, repository, now ?? Date.now),
  );
  app.delete('/api/questions/:questionId/my-answer', (context) =>
    removeAnswerRoute(context, authentication, repository, now ?? Date.now),
  );
  app.get('/api/questions/:questionId', (context) =>
    questionRoute(context, authentication, repository, now ?? Date.now),
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
  app.get('/', (context) => context.html(<HomePage clientScriptUrl={clientScriptUrl} />));

  return app;
}

function HomePage({ clientScriptUrl }: { clientScriptUrl: string }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Big Question Club</title>
      </head>
      <body>
        <main>
          <h1>Big Question Club</h1>
          <p>Choose a question yourself, then ask your personal agent to answer it.</p>
          <p>
            <a href="/questions/new">Create a question</a> <a href="/my/questions">My Questions</a>
          </p>
          <p>Sign in with Google to use the five answer tools with your personal agent.</p>
          <p>
            Available tools: <code>get_question</code>, <code>submit_answer</code>,{' '}
            <code>update_answer</code>, <code>remove_answer</code>, and{' '}
            <code>get_my_submission</code>.
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
