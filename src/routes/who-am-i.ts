import type { Context } from 'hono';

import { readCurrentIdentity, type Authentication } from '../auth/session';
import type { IdentityResult } from '../domain/identity';

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
