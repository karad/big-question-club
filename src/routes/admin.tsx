import type { Context } from 'hono';
import { readCurrentIdentity, type Authentication } from '../auth/session';
import { ADMIN_PAGE_SIZE, ADMIN_PATH, createAdminPage, type AdminListKind } from '../domain/admin';
import { parsePage } from '../domain/question-listing';
import type {
  AdminListResult,
  AdminRepository,
  AdminUserView,
  AuditLogView,
  BanUserResult,
  DeleteAdminTargetResult,
  UnbanUserResult,
} from '../repositories/admin-repository';
import type { Answer, Question } from '../domain/question';
import {
  ADMIN_RESPONSE_HEADERS,
  AdminDashboardPage,
  AdminListPage,
  AdminMessagePage,
} from '../views/admin';

type AuthorizedAdmin = { userId: string; repository: AdminRepository };

/**
 * Renders the administration dashboard.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the administrator.
 * @param repository - Administration repository used to load summary data.
 * @returns The rendered dashboard or an authorization error.
 */
export async function adminDashboardRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: AdminRepository | undefined,
): Promise<Response> {
  const authorized = await authorizeAdmin(context, authentication, repository);
  if (authorized instanceof Response) return authorized;
  try {
    const summary = await authorized.repository.getSummary();
    return context.html(<AdminDashboardPage summary={summary} />, 200, ADMIN_RESPONSE_HEADERS);
  } catch {
    return adminError(context, 503, 'Administration is unavailable. Try again.');
  }
}

/**
 * Renders a paginated administration resource list.
 * @param context - Hono request context.
 * @param kind - Administration resource to list.
 * @param authentication - Authentication service used to resolve the administrator.
 * @param repository - Administration repository used to load records.
 * @param now - Current timestamp provider.
 * @returns The rendered list or an authorization error.
 */
export async function adminListRoute(
  context: Context,
  kind: AdminListKind,
  authentication: Authentication | undefined,
  repository: AdminRepository | undefined,
  now: () => number,
): Promise<Response> {
  const authorized = await authorizeAdmin(context, authentication, repository);
  if (authorized instanceof Response) return authorized;
  const page = parsePage(context.req.query('page'));
  const offset = (page - 1) * ADMIN_PAGE_SIZE;
  try {
    const result = await readAdminList(authorized.repository, kind, ADMIN_PAGE_SIZE, offset);
    return context.html(
      <AdminListPage
        kind={kind}
        result={createAdminPage(result.items, result.totalItems, page)}
        adminUserId={authorized.userId}
        now={now()}
      />,
      200,
      ADMIN_RESPONSE_HEADERS,
    );
  } catch {
    return adminError(context, 503, 'Administration is unavailable. Try again.');
  }
}

function readAdminList(
  repository: AdminRepository,
  kind: AdminListKind,
  limit: number,
  offset: number,
): Promise<AdminListResult<AdminUserView | Question | Answer | AuditLogView>> {
  if (kind === 'users') return repository.listUsers(limit, offset);
  if (kind === 'questions') return repository.listQuestions(limit, offset);
  if (kind === 'answers') return repository.listAnswers(limit, offset);
  return repository.listAuditLogs(limit, offset);
}

/**
 * Deletes a question through the administration interface.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the administrator.
 * @param repository - Administration repository used for the deletion.
 * @param now - Current timestamp provider for the audit record.
 * @returns A redirect or a structured administration error.
 */
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
    `${ADMIN_PATH}/questions`,
    (admin, target, actor, timestamp) => admin.deleteQuestion(target, actor, timestamp),
  );
}

/**
 * Deletes an answer through the administration interface.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the administrator.
 * @param repository - Administration repository used for the deletion.
 * @param now - Current timestamp provider for the audit record.
 * @returns A redirect or a structured administration error.
 */
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
    `${ADMIN_PATH}/answers`,
    (admin, target, actor, timestamp) => admin.deleteAnswer(target, actor, timestamp),
  );
}

/**
 * Bans a user through the administration interface.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the administrator.
 * @param repository - Administration repository used to create the ban.
 * @param now - Current timestamp provider for the audit record.
 * @returns A redirect or a structured administration error.
 */
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
    `${ADMIN_PATH}/users`,
    (admin, target, actor, timestamp) => admin.banUser(target, actor, timestamp),
  );
}

/**
 * Removes a user's ban through the administration interface.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the administrator.
 * @param repository - Administration repository used to remove the ban.
 * @param now - Current timestamp provider for the audit record.
 * @returns A redirect or a structured administration error.
 */
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
    `${ADMIN_PATH}/users`,
    (admin, target, actor, timestamp) => admin.unbanUser(target, actor, timestamp),
  );
}

async function runAdminMutation(
  context: Context,
  authentication: Authentication | undefined,
  repository: AdminRepository | undefined,
  now: () => number,
  successRedirect: string,
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
      return context.redirect(successRedirect, 303);
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
  if ('code' in identity || repository === undefined) return hiddenAdministrationRoute(context);
  try {
    return (await repository.isAdmin(identity.userId))
      ? { userId: identity.userId, repository }
      : hiddenAdministrationRoute(context);
  } catch {
    return hiddenAdministrationRoute(context);
  }
}

function hiddenAdministrationRoute(context: Context): Response {
  return context.text('Not Found', 404);
}

function adminError(context: Context, status: 400 | 401 | 403 | 404 | 409 | 503, message: string) {
  return context.html(
    <AdminMessagePage title="Administration" message={message} />,
    status,
    ADMIN_RESPONSE_HEADERS,
  );
}
