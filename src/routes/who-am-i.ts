import type { Context } from 'hono';

import { readCurrentIdentity, type Authentication } from '../auth/session';
import type { IdentityResult } from '../domain/identity';

/**
 * Returns the identity associated with the current request.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the session.
 * @returns An HTTP response containing an identity result.
 */
export async function whoAmIRoute(
  context: Context,
  authentication: Pick<Authentication, 'getSession'> | undefined,
): Promise<Response> {
  const identity = await readCurrentIdentity(authentication, context.req.raw);
  return context.json(identity, getStatus(identity), { 'Cache-Control': 'no-store' });
}

function getStatus(result: IdentityResult): 200 | 401 | 500 {
  if (!('code' in result)) {
    return 200;
  }

  return result.code === 'AUTHENTICATION_REQUIRED' ? 401 : 500;
}
