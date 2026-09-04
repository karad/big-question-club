import type { Context } from 'hono';

import { createIdentityError } from '../domain/identity';
import type { Authentication } from '../auth/session';

/**
 * Delegates authentication requests to the configured auth service.
 * @param context - Hono request context.
 * @param authentication - Authentication service handling the request.
 * @returns The authentication service response.
 */
export async function authenticationRoute(
  context: Context,
  authentication: Pick<Authentication, 'handle'> | undefined,
): Promise<Response> {
  if (authentication === undefined) {
    return context.json(createIdentityError('IDENTITY_UNAVAILABLE'), 500, {
      'Cache-Control': 'no-store',
    });
  }

  return authentication.handle(context.req.raw);
}
