import type { Context } from 'hono';
import { readCurrentIdentity, type Authentication } from '../auth/session';
import type {
  AdminRepository,
  BanUserResult,
  DeleteAdminTargetResult,
  UnbanUserResult,
} from '../repositories/admin-repository';
import { ADMIN_RESPONSE_HEADERS, AdminDashboardPage, AdminMessagePage } from '../views/admin';

type AuthorizedAdmin = { userId: string; repository: AdminRepository };

export async function adminDashboardRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: AdminRepository | undefined,
  now: () => number,
): Promise<Response> {
  const authorized = await authorizeAdmin(context, authentication, repository);
  if (authorized instanceof Response) return authorized;
  try {
    const dashboard = await authorized.repository.getDashboard();
    return context.html(
      <AdminDashboardPage dashboard={dashboard} adminUserId={authorized.userId} now={now()} />,
      200,
      ADMIN_RESPONSE_HEADERS,
    );
  } catch {
    return adminError(context, 503, 'Administration is unavailable. Try again.');
  }
}

export async function deleteAdminQuestionRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: AdminRepository | undefined,
  now: () => number,
): Promise<Response> {
  return runAdminMutation(
    context,
    authentication,
    repository,
    now,
    (admin, target, actor, timestamp) => admin.deleteQuestion(target, actor, timestamp),
  );
}

export async function deleteAdminAnswerRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: AdminRepository | undefined,
  now: () => number,
): Promise<Response> {
  return runAdminMutation(
    context,
    authentication,
    repository,
    now,
    (admin, target, actor, timestamp) => admin.deleteAnswer(target, actor, timestamp),
  );
}

export async function banAdminUserRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: AdminRepository | undefined,
  now: () => number,
): Promise<Response> {
  return runAdminMutation(
    context,
    authentication,
    repository,
    now,
    (admin, target, actor, timestamp) => admin.banUser(target, actor, timestamp),
  );
}

export async function unbanAdminUserRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: AdminRepository | undefined,
  now: () => number,
): Promise<Response> {
  return runAdminMutation(
    context,
    authentication,
    repository,
    now,
    (admin, target, actor, timestamp) => admin.unbanUser(target, actor, timestamp),
  );
}

async function runAdminMutation(
  context: Context,
  authentication: Authentication | undefined,
  repository: AdminRepository | undefined,
  now: () => number,
  operation: (
    repository: AdminRepository,
    targetId: string,
    actorUserId: string,
    timestamp: number,
  ) => Promise<DeleteAdminTargetResult | BanUserResult | UnbanUserResult>,
): Promise<Response> {
  const authorized = await authorizeAdmin(context, authentication, repository);
  if (authorized instanceof Response) return authorized;
  const form = await context.req.parseBody();
  if (form.confirm !== 'on') return adminError(context, 400, 'Confirm this administration action.');
  const targetId = context.req.param('targetId');
  if (targetId === undefined) return adminError(context, 404, 'Administration target not found.');
  try {
    const result = await operation(authorized.repository, targetId, authorized.userId, now());
    if (result === 'deleted' || result === 'banned' || result === 'unbanned') {
      return context.redirect('/admin', 303);
    }
    if (result === 'missing' || result === 'not-banned')
      return adminError(context, 404, 'Administration target not found.');
    if (result === 'self-forbidden' || result === 'already-banned')
      return adminError(context, 409, 'Administration action conflicts with the current state.');
    return adminError(context, 503, 'Administration is unavailable. Try again.');
  } catch {
    return adminError(context, 503, 'Administration is unavailable. Try again.');
  }
}

async function authorizeAdmin(
  context: Context,
  authentication: Authentication | undefined,
  repository: AdminRepository | undefined,
): Promise<AuthorizedAdmin | Response> {
  const identity = await readCurrentIdentity(authentication, context.req.raw);
  if ('code' in identity) {
    return identity.code === 'AUTHENTICATION_REQUIRED'
      ? adminError(context, 401, 'Sign in to administer Big Question Club.')
      : adminError(context, 503, 'Administration is unavailable. Try again.');
  }
  if (repository === undefined)
    return adminError(context, 503, 'Administration is unavailable. Try again.');
  try {
    return (await repository.isAdmin(identity.userId))
      ? { userId: identity.userId, repository }
      : adminError(context, 403, 'Administrator access required.');
  } catch {
    return adminError(context, 503, 'Administration is unavailable. Try again.');
  }
}

function adminError(context: Context, status: 400 | 401 | 403 | 404 | 409 | 503, message: string) {
  return context.html(
    <AdminMessagePage title="Administration" message={message} />,
    status,
    ADMIN_RESPONSE_HEADERS,
  );
}
