import { Hono } from 'hono';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';

import type { Authentication } from './auth/session';
import type { AdminRepository } from './repositories/admin-repository';
import { ADMIN_PATH } from './domain/admin';
import { answerError } from './domain/answer-submission';
import { authenticationRoute } from './routes/auth';
import { homeRoute } from './routes/home';
import { questionListRoute } from './routes/question-list';
import { healthRoute } from './routes/health';
import { verificationQuestionRoute } from './routes/verification-question';
import { whoAmIRoute } from './routes/who-am-i';
import type { QuestionRepository } from './repositories/question-repository';
import { submitAnswerRoute } from './routes/submit-answer';
import { removeAnswerRoute, updateAnswerRoute } from './routes/answer-mutation';
import {
  answerDetailRoute,
  mySubmissionRoute,
  PRIVATE_RESPONSE_HEADERS,
  questionPageRoute,
  questionRoute,
} from './routes/question';
import {
  createQuestionRoute,
  deleteQuestionRoute,
  editQuestionPageRoute,
  myQuestionsRoute,
  newQuestionPageRoute,
  publishQuestionRoute,
  reviewQuestionRoute,
  updateQuestionRoute,
} from './routes/question-management';
import {
  adminDashboardRoute,
  adminListRoute,
  banAdminUserRoute,
  deleteAdminAnswerRoute,
  deleteAdminQuestionRoute,
  unbanAdminUserRoute,
} from './routes/admin';

export function createApp({
  authentication,
  adminRepository,
  clientScriptUrl = '/client.js',
  repository,
  now,
}: {
  authentication?: Authentication;
  adminRepository?: AdminRepository;
  clientScriptUrl?: string;
  repository?: QuestionRepository;
  now?: () => number;
} = {}): Hono {
  const app = new Hono();

  app.onError((error, context) => {
    if (error instanceof HTTPException) return error.getResponse();
    console.error(error);
    if (context.req.path.startsWith('/api/questions/'))
      return context.json(answerError('TOOL_UNAVAILABLE'), 500, PRIVATE_RESPONSE_HEADERS);
    return context.json({ error: 'Internal server error' }, 500);
  });

  app.get('/health', healthRoute);
  app.get(ADMIN_PATH, (context) => adminDashboardRoute(context, authentication, adminRepository));
  app.get(`${ADMIN_PATH}/users`, (context) =>
    adminListRoute(context, 'users', authentication, adminRepository, now ?? Date.now),
  );
  app.get(`${ADMIN_PATH}/questions`, (context) =>
    adminListRoute(context, 'questions', authentication, adminRepository, now ?? Date.now),
  );
  app.get(`${ADMIN_PATH}/answers`, (context) =>
    adminListRoute(context, 'answers', authentication, adminRepository, now ?? Date.now),
  );
  app.get(`${ADMIN_PATH}/audit-log`, (context) =>
    adminListRoute(context, 'audit-log', authentication, adminRepository, now ?? Date.now),
  );
  app.post(`${ADMIN_PATH}/questions/:targetId/delete`, csrf(), (context) =>
    deleteAdminQuestionRoute(context, authentication, adminRepository, now ?? Date.now),
  );
  app.post(`${ADMIN_PATH}/answers/:targetId/delete`, csrf(), (context) =>
    deleteAdminAnswerRoute(context, authentication, adminRepository, now ?? Date.now),
  );
  app.post(`${ADMIN_PATH}/users/:targetId/ban`, csrf(), (context) =>
    banAdminUserRoute(context, authentication, adminRepository, now ?? Date.now),
  );
  app.post(`${ADMIN_PATH}/users/:targetId/unban`, csrf(), (context) =>
    unbanAdminUserRoute(context, authentication, adminRepository, now ?? Date.now),
  );
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
  app.post('/questions/:questionId/delete', csrf(), (context) =>
    deleteQuestionRoute(context, authentication, repository, now ?? Date.now, clientScriptUrl),
  );
  app.get('/questions/open', (context) =>
    questionListRoute(
      context,
      'open',
      authentication,
      repository,
      now ?? Date.now,
      clientScriptUrl,
    ),
  );
  app.get('/questions/revealed', (context) =>
    questionListRoute(
      context,
      'revealed',
      authentication,
      repository,
      now ?? Date.now,
      clientScriptUrl,
    ),
  );
  app.get('/questions/:questionId', (context) =>
    questionPageRoute(context, authentication, repository, now ?? Date.now, clientScriptUrl),
  );
  app.get('/', (context) =>
    homeRoute(context, authentication, repository, now ?? Date.now, clientScriptUrl),
  );

  app.notFound((context) =>
    context.req.path.startsWith('/api/questions/')
      ? context.json(answerError('ANSWER_UNAVAILABLE'), 404, PRIVATE_RESPONSE_HEADERS)
      : context.text('Not Found', 404),
  );

  return app;
}
