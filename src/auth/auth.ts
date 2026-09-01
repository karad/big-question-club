import { betterAuth } from 'better-auth';

import { readAuthConfiguration } from './config';
import type { Authentication } from './session';

export function createAuthentication(env: Env): Authentication {
  const configuration = readAuthConfiguration(env);

  if ('code' in configuration) {
    throw new Error(configuration.code);
  }

  const auth = betterAuth({
    baseURL: configuration.baseUrl,
    database: env.big_question_club_auth,
    secret: configuration.secret,
    socialProviders: {
      google: {
        clientId: configuration.googleClientId,
        clientSecret: configuration.googleClientSecret,
        prompt: 'select_account consent',
      },
    },
  });

  return {
    handle: (request) => auth.handler(request),
    getSession: async (request) => {
      const session = await auth.api.getSession({ headers: request.headers });
      return session === null ? null : { user: { id: session.user.id } };
    },
  };
}
