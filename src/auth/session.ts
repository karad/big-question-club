import { createIdentity, createIdentityError, type IdentityResult } from '../domain/identity';

export type AuthenticatedSession = { user: { id: string } };

export type Authentication = {
  getSession: (request: Request) => Promise<AuthenticatedSession | null>;
  handle: (request: Request) => Promise<Response>;
};

export type ApplicationDatabases = {
  data: D1Database;
};

/**
 * Resolves the authenticated identity for an incoming request.
 * @param authentication - Authentication service used to read the session.
 * @param request - Incoming HTTP request.
 * @returns A successful identity or a structured authentication error.
 */
export async function readCurrentIdentity(
  authentication: Pick<Authentication, 'getSession'> | undefined,
  request: Request,
): Promise<IdentityResult> {
  if (authentication === undefined) {
    return createIdentityError('IDENTITY_UNAVAILABLE');
  }

  try {
    const session = await authentication.getSession(request);
    return session === null
      ? createIdentityError('AUTHENTICATION_REQUIRED')
      : createIdentity(session.user.id);
  } catch {
    return createIdentityError('IDENTITY_UNAVAILABLE');
  }
}
