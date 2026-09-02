import { createAuthentication } from './auth/auth';
import { createApp } from './app';
import { createQuestionRepository } from './repositories/question-repository';
import type { ApplicationDatabases } from './auth/session';

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const databases: ApplicationDatabases = { data: env.big_question_club_data };
    return Promise.resolve(
      createApp({
        authentication: createAuthentication(env),
        clientScriptUrl: '/client.js',
        repository: createQuestionRepository(databases.data),
      }).fetch(request, env),
    );
  },
};
