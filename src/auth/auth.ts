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
    databaseHooks: {
      session: {
        create: {
          before: createSessionBanGuard(env.big_question_club_auth),
        },
      },
    },
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
      if (session === null || (await isUserBanned(env.big_question_club_auth, session.user.id))) {
        return null;
      }
      return { user: { id: session.user.id } };
    },
  };
}

export function createSessionBanGuard(database: D1Database) {
  return async (session: { userId: string }): Promise<false | void> => {
    if (await isUserBanned(database, session.userId)) return false;
  };
}

export async function isUserBanned(database: D1Database, userId: string): Promise<boolean> {
  const ban = await database
    .prepare('SELECT user_id FROM banned_users WHERE user_id = ?')
    .bind(userId)
    .first();
  return ban !== null;
}
