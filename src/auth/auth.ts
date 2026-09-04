import { betterAuth } from 'better-auth';

import { readAuthConfiguration } from './config';
import type { Authentication } from './session';

/**
 * Creates the Better Auth adapter used by the application.
 * @param env - Worker environment containing auth configuration and database bindings.
 * @returns The configured authentication service.
 */
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

/**
 * Creates a session hook that rejects users currently present in the ban list.
 * @param database - Cloudflare D1 database binding.
 * @returns A Better Auth session-creation hook.
 */
export function createSessionBanGuard(database: D1Database) {
  return async (session: { userId: string }): Promise<false | void> => {
    if (await isUserBanned(database, session.userId)) return false;
  };
}

/**
 * Checks whether a user is currently banned.
 * @param database - Cloudflare D1 database binding.
 * @param userId - User identifier to look up.
 * @returns True when a ban record exists.
 */
export async function isUserBanned(database: D1Database, userId: string): Promise<boolean> {
  const ban = await database
    .prepare('SELECT user_id FROM banned_users WHERE user_id = ?')
    .bind(userId)
    .first();
  return ban !== null;
}
