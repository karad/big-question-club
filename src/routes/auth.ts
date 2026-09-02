import type { Context } from 'hono';

import { createIdentityError } from '../domain/identity';
import type { Authentication } from '../auth/session';

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
