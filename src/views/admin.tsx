import { ADMIN_PATH, adminListPath, type AdminListKind, type AdminPage } from '../domain/admin';
import { formatUtcDateTime } from '../domain/date-time';
import type { Answer, Question } from '../domain/question';
import { getQuestionState } from '../domain/question-lifecycle';
import type { AdminSummary, AdminUserView, AuditLogView } from '../repositories/admin-repository';
import { Icon } from './icon';
import { SiteHeader } from './site-header';

export const ADMIN_RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie',
} as const;

type AdminListItem = AdminUserView | Question | Answer | AuditLogView;

const listConfig: Record<
  AdminListKind,
  { title: string; description: string; icon: 'users' | 'bookOpen' | 'clock' }
> = {
  users: {
    title: 'Users',
    description: 'Account status and moderation access. Banning a user expires active sessions.',
    icon: 'users',
  },
  questions: {
    title: 'Questions',
    description: 'Published and draft prompts, ordered by the most recently created.',
    icon: 'bookOpen',
  },
  answers: {
    title: 'Answers',
    description: 'Answer excerpts and full public content for moderation review.',
    icon: 'bookOpen',
  },
  'audit-log': {
    title: 'Audit log',
    description: 'Append-only evidence of security-sensitive and moderation activity.',
    icon: 'clock',
  },
};

export function AdminMessagePage({ title, message }: { title: string; message: string }) {
  return (
    <AdminLayout title={title}>
      <section class="paper-card mx-auto max-w-2xl border-red-900/20">
        <p class="eyebrow text-red-800">Operation status</p>
        <h1 class="editorial-title mt-3 text-3xl sm:text-4xl">{message}</h1>
        <a class="button-secondary mt-6" href={ADMIN_PATH}>
          <Icon name="arrowLeft" />
          Back to administration
        </a>
      </section>
    </AdminLayout>
  );
}

export function AdminDashboardPage({ summary }: { summary: AdminSummary }) {
  const destinations = [
    ['users', 'Users', summary.userCount, 'Review account status and control access.'],
    ['questions', 'Questions', summary.questionCount, 'Review and remove submitted questions.'],
    ['answers', 'Answers', summary.answerCount, 'Inspect answer excerpts and full content.'],
    ['audit-log', 'Audit log', summary.auditLogCount, 'Trace security-sensitive activity.'],
  ] as const;
  return (
    <AdminLayout title="Administration">
      <AdminHero summary={summary} />
      <section class="mt-10" aria-labelledby="admin-destinations">
        <p class="eyebrow">Choose a list</p>
        <h2 id="admin-destinations" class="section-title mt-2">
          Administration lists
        </h2>
        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          {destinations.map(([kind, title, count, description]) => (
            <a
              class="paper-card group flex items-center justify-between gap-5 text-ink no-underline transition hover:-translate-y-0.5 hover:border-action"
              href={adminListPath(kind)}
              key={kind}
            >
              <span>
                <span class="block text-xs font-bold uppercase tracking-[0.18em] text-ink-muted">
                  {count} total
                </span>
                <span class="mt-2 block font-display text-3xl font-bold">{title}</span>
                <span class="mt-2 block text-sm leading-6 text-ink-muted">{description}</span>
              </span>
              <span class="grid size-11 shrink-0 place-items-center rounded-full bg-action text-white transition group-hover:bg-action-deep">
                <Icon name="arrowRight" />
              </span>
            </a>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}

export function AdminListPage({
  kind,
  result,
  adminUserId,
  now,
}: {
  kind: AdminListKind;
  result: AdminPage<AdminListItem>;
  adminUserId: string;
  now: number;
}) {
  const config = listConfig[kind];
  return (
    <AdminLayout title={`${config.title} — Administration`}>
      <a class="inline-flex items-center gap-2 text-sm font-semibold" href={ADMIN_PATH}>
        <Icon name="arrowLeft" />
        Administration
      </a>
      <header class="mt-6 flex flex-col justify-between gap-4 border-b border-ink/15 pb-6 sm:flex-row sm:items-end">
        <div>
          <p class="eyebrow">Private operations</p>
          <div class="mt-2 flex items-center gap-3">
            <span class="grid size-11 place-items-center rounded-full bg-action text-white">
              <Icon name={config.icon} />
            </span>
            <h1 class="editorial-title">{config.title}</h1>
            <span class="rounded-full bg-paper-deep px-3 py-1 text-sm font-bold tabular-nums">
              {result.totalItems}
            </span>
          </div>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">{config.description}</p>
        </div>
        <AdminListNavigation current={kind} />
      </header>

      <section class="mt-6" aria-label={`${config.title} list`}>
        {result.items.length === 0 ? (
          <div class="paper-card text-ink-muted">
            <p>No {kind === 'audit-log' ? 'audit events' : kind} on this page.</p>
            {result.page > 1 ? <a href={adminListPath(kind)}>Go to page 1</a> : null}
          </div>
        ) : (
          <TableFrame>
            {kind === 'users' ? (
              <UserTable users={result.items as AdminUserView[]} adminUserId={adminUserId} />
            ) : kind === 'questions' ? (
              <QuestionTable questions={result.items as Question[]} now={now} />
            ) : kind === 'answers' ? (
              <AnswerTable answers={result.items as Answer[]} />
            ) : (
              <AuditTable auditLogs={result.items as AuditLogView[]} />
            )}
          </TableFrame>
        )}
      </section>

      <Pagination kind={kind} result={result} />
    </AdminLayout>
  );
}

function AdminLayout({ title, children }: { title: string; children: unknown }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="theme-color" content="#fffaf4" />
        <title>{title} — Big Question Club</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <SiteHeader navigationLabel="Administration">
          <a href={ADMIN_PATH}>Administration</a>
        </SiteHeader>
        <main id="top" class="page-shell" data-page="administration">
          {children}
        </main>
      </body>
    </html>
  );
}

function AdminHero({ summary }: { summary: AdminSummary }) {
  return (
    <header class="rounded-3xl border border-line bg-paper-deep px-5 py-8 text-ink shadow-[0_2px_0_rgba(80,45,20,0.06)] sm:px-8 sm:py-10">
      <p class="eyebrow">Private operations</p>
      <div class="mt-3 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 class="font-display break-words text-3xl font-bold tracking-tight min-[360px]:text-4xl sm:text-6xl">
            Administration
          </h1>
          <p class="mt-4 max-w-2xl text-sm leading-6 text-ink-muted sm:text-base">
            Select a dedicated list to review public content or account activity. Destructive
            actions require explicit confirmation and cannot be undone.
          </p>
        </div>
        <dl class="grid grid-cols-2 gap-2 text-center sm:grid-cols-4" aria-label="Content totals">
          <Metric label="Users" value={summary.userCount} />
          <Metric label="Questions" value={summary.questionCount} />
          <Metric label="Answers" value={summary.answerCount} />
          <Metric label="Events" value={summary.auditLogCount} />
        </dl>
      </div>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div class="min-w-0 rounded-2xl border border-line bg-panel px-2 py-3 sm:min-w-24 sm:px-3">
      <dt class="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd class="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function AdminListNavigation({ current }: { current: AdminListKind }) {
  return (
    <nav
      class="flex max-w-sm flex-wrap gap-x-4 gap-y-2 text-sm font-semibold"
      aria-label="Administration lists"
    >
      {(Object.keys(listConfig) as AdminListKind[]).map((kind) =>
        kind === current ? (
          <span class="text-ink-muted" aria-current="page" key={kind}>
            {listConfig[kind].title}
          </span>
        ) : (
          <a href={adminListPath(kind)} key={kind}>
            {listConfig[kind].title}
          </a>
        ),
      )}
    </nav>
  );
}

function UserTable({ users, adminUserId }: { users: AdminUserView[]; adminUserId: string }) {
  return (
    <table class="admin-table">
      <thead>
        <tr>
          <th scope="col">User</th>
          <th scope="col">Email</th>
          <th scope="col">Created</th>
          <th scope="col">Status</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <th scope="row">
              <span class="block font-semibold text-ink">{user.name}</span>
              <code class="admin-identifier">{user.id}</code>
            </th>
            <td class="break-all">{user.email}</td>
            <td class="whitespace-nowrap">{formatTime(user.createdAt)}</td>
            <td>
              {user.bannedAt === null ? (
                <StatusBadge tone="active">Active</StatusBadge>
              ) : (
                <div class="space-y-1">
                  <StatusBadge tone="danger">Banned</StatusBadge>
                  <span class="block whitespace-nowrap text-xs text-ink-muted">
                    {formatTime(user.bannedAt)}
                  </span>
                </div>
              )}
            </td>
            <td>
              {user.id === adminUserId ? (
                <StatusBadge tone="admin">Administrator</StatusBadge>
              ) : user.bannedAt === null ? (
                <ConfirmForm
                  action={`${ADMIN_PATH}/users/${encodeURIComponent(user.id)}/ban`}
                  label="Ban user"
                />
              ) : (
                <ConfirmForm
                  action={`${ADMIN_PATH}/users/${encodeURIComponent(user.id)}/unban`}
                  label="Unban user"
                  intent="restore"
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function QuestionTable({ questions, now }: { questions: Question[]; now: number }) {
  return (
    <table class="admin-table min-w-5xl">
      <thead>
        <tr>
          <th scope="col">Question</th>
          <th scope="col">State</th>
          <th scope="col">Creator</th>
          <th scope="col">Created</th>
          <th scope="col">Updated</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        {questions.map((question) => (
          <tr key={question.id}>
            <th class="min-w-72" scope="row">
              <span class="prose-safe block font-semibold leading-6 text-ink">{question.body}</span>
              <code class="admin-identifier mt-2 inline-block">{question.id}</code>
            </th>
            <td>
              <StatusBadge tone="neutral">{getQuestionState(question, now)}</StatusBadge>
            </td>
            <td>
              <code class="admin-identifier">{question.creatorUserId}</code>
            </td>
            <td class="whitespace-nowrap">{formatTime(question.createdAt)}</td>
            <td class="whitespace-nowrap">{formatTime(question.updatedAt)}</td>
            <td>
              <ConfirmForm
                action={`${ADMIN_PATH}/questions/${encodeURIComponent(question.id)}/delete`}
                label="Delete question"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AnswerTable({ answers }: { answers: Answer[] }) {
  return (
    <table class="admin-table min-w-6xl">
      <thead>
        <tr>
          <th scope="col">Answer</th>
          <th scope="col">Question</th>
          <th scope="col">User</th>
          <th scope="col">Created</th>
          <th scope="col">Updated</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        {answers.map((answer) => (
          <tr key={answer.id}>
            <th class="min-w-96 max-w-xl" scope="row">
              <span class="prose-safe block font-semibold leading-6 text-ink">
                {answer.excerpt}
              </span>
              <span class="prose-safe mt-3 block border-t border-ink/10 pt-3 text-sm font-normal leading-6 text-ink-muted">
                {answer.body}
              </span>
              <code class="admin-identifier mt-2 inline-block">{answer.id}</code>
            </th>
            <td>
              <code class="admin-identifier">{answer.questionId}</code>
            </td>
            <td>
              <code class="admin-identifier">{answer.userId}</code>
            </td>
            <td class="whitespace-nowrap">{formatTime(answer.createdAt)}</td>
            <td class="whitespace-nowrap">{formatTime(answer.updatedAt)}</td>
            <td>
              <ConfirmForm
                action={`${ADMIN_PATH}/answers/${encodeURIComponent(answer.id)}/delete`}
                label="Delete answer"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AuditTable({ auditLogs }: { auditLogs: AuditLogView[] }) {
  return (
    <table class="admin-table">
      <thead>
        <tr>
          <th scope="col">Time</th>
          <th scope="col">Actor</th>
          <th scope="col">Action</th>
          <th scope="col">Target</th>
          <th scope="col">Outcome</th>
        </tr>
      </thead>
      <tbody>
        {auditLogs.map((log) => (
          <tr key={log.id}>
            <td class="whitespace-nowrap">{formatTime(log.createdAt)}</td>
            <td>
              <code class="admin-identifier">{log.actorUserId}</code>
            </td>
            <td class="font-semibold">{log.action}</td>
            <td>
              <span class="block text-xs font-semibold text-ink-muted">{log.targetType}</span>
              <code class="admin-identifier">{log.targetId}</code>
            </td>
            <td>
              <StatusBadge tone="active">{log.outcome}</StatusBadge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableFrame({ children }: { children: unknown }) {
  return <div class="overflow-x-auto rounded-2xl border border-line bg-panel">{children}</div>;
}

function StatusBadge({
  tone,
  children,
}: {
  tone: 'active' | 'admin' | 'danger' | 'neutral';
  children: unknown;
}) {
  const toneClass = {
    active: 'bg-emerald-50 text-emerald-900',
    admin: 'bg-paper-deep text-action-deep',
    danger: 'bg-red-100 text-red-900',
    neutral: 'bg-amber-50 text-amber-900',
  }[tone];
  return (
    <span
      class={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${toneClass}`}
    >
      {children}
    </span>
  );
}

function ConfirmForm({
  action,
  label,
  intent = 'danger',
}: {
  action: string;
  label: string;
  intent?: 'danger' | 'restore';
}) {
  return (
    <form method="post" action={action}>
      <div class="flex min-w-36 flex-col items-start gap-3">
        <label class="flex cursor-pointer items-start gap-2 text-xs font-medium leading-5 text-ink-muted">
          <input class="mt-0.5 size-4 accent-red-700" type="checkbox" name="confirm" required />
          Confirm {label.toLowerCase()}
        </label>
        <button
          class={
            intent === 'danger'
              ? 'button-danger min-h-10 px-4 py-2 text-sm'
              : 'button-secondary min-h-10 px-4 py-2 text-sm'
          }
          type="submit"
        >
          <Icon name={intent === 'danger' ? 'trash' : 'unlock'} />
          {label}
        </button>
      </div>
    </form>
  );
}

function Pagination({ kind, result }: { kind: AdminListKind; result: AdminPage<AdminListItem> }) {
  return (
    <nav class="mt-8 flex items-center justify-between gap-4" aria-label="Pagination">
      {result.page > 1 ? (
        <a class="button-secondary" href={`${adminListPath(kind)}?page=${result.page - 1}`}>
          <Icon name="arrowLeft" />
          Previous
        </a>
      ) : (
        <span />
      )}
      <p class="text-center text-sm font-semibold tabular-nums">
        Page {result.page} of {result.totalPages}
      </p>
      {result.page < result.totalPages ? (
        <a class="button-secondary" href={`${adminListPath(kind)}?page=${result.page + 1}`}>
          Next
          <Icon name="arrowRight" />
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}

function formatTime(timestamp: number): string {
  return formatUtcDateTime(timestamp);
}
