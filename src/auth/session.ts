import { createIdentity, createIdentityError, type IdentityResult } from '../domain/identity';

export type AuthenticatedSession = { user: { id: string } };

export type Authentication = {
  getSession: (request: Request) => Promise<AuthenticatedSession | null>;
  handle: (request: Request) => Promise<Response>;
};

export type ApplicationDatabases = {
  questions: D1Database;
};

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
