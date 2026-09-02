import { createAuthentication } from './auth/auth';
import { createApp } from './app';
import { createQuestionRepository } from './repositories/question-repository';
import type { ApplicationDatabases } from './auth/session';
import { readAdminEmail } from './domain/admin';
import { createAdminRepository } from './repositories/admin-repository';

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const databases: ApplicationDatabases = { data: env.big_question_club_data };
    const adminEmail = readAdminEmail(env.ADMIN_EMAIL);
    return Promise.resolve(
      createApp({
        ...(adminEmail === null
          ? {}
          : { adminRepository: createAdminRepository(databases.data, adminEmail) }),
        authentication: createAuthentication(env),
        clientScriptUrl: '/client.js',
        repository: createQuestionRepository(databases.data),
      }).fetch(request, env),
    );
  },
};
