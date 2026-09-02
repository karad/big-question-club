import { toIsoTimestamp, type Question } from '../domain/question';
import { getQuestionState } from '../domain/question-lifecycle';
import { ADMIN_PATH } from '../domain/admin';
import type { AdminDashboard } from '../repositories/admin-repository';
import { SiteHeader } from './site-header';

export const ADMIN_RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie',
} as const;

export function AdminMessagePage({ title, message }: { title: string; message: string }) {
  return (
    <AdminLayout title={title}>
      <h1>{message}</h1>
      <a href="/">Back to Big Question Club</a>
    </AdminLayout>
  );
}

export function AdminDashboardPage({
  dashboard,
  adminUserId,
  now,
}: {
  dashboard: AdminDashboard;
  adminUserId: string;
  now: number;
}) {
  return (
    <AdminLayout title="Administration">
      <h1>Administration</h1>
      <p>Review public content and account activity. Deletion cannot be undone.</p>
      <UserSection dashboard={dashboard} adminUserId={adminUserId} />
      <QuestionSection questions={dashboard.questions} now={now} />
      <AnswerSection answers={dashboard.answers} />
      <AuditSection auditLogs={dashboard.auditLogs} />
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
        <title>{title} — Big Question Club</title>
      </head>
      <body>
        <SiteHeader navigationLabel="Administration">
          <a href={ADMIN_PATH}>Administration</a>
        </SiteHeader>
        <main>{children}</main>
      </body>
    </html>
  );
}

function UserSection({
  dashboard,
  adminUserId,
}: {
  dashboard: AdminDashboard;
  adminUserId: string;
}) {
  return (
    <section aria-labelledby="admin-users">
      <h2 id="admin-users">Users</h2>
      {dashboard.users.length === 0 ? (
        <p>No users.</p>
      ) : (
        <table>
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
            {dashboard.users.map((user) => (
              <tr key={user.id}>
                <th scope="row">
                  {user.name} ({user.id})
                </th>
                <td>{user.email}</td>
                <td>{formatTime(user.createdAt)}</td>
                <td>{user.bannedAt === null ? 'Active' : `Banned ${formatTime(user.bannedAt)}`}</td>
                <td>
                  {user.id === adminUserId ? (
                    'Administrator'
                  ) : user.bannedAt === null ? (
                    <ConfirmForm
                      action={`${ADMIN_PATH}/users/${encodeURIComponent(user.id)}/ban`}
                      label="Ban user"
                    />
                  ) : (
                    <ConfirmForm
                      action={`${ADMIN_PATH}/users/${encodeURIComponent(user.id)}/unban`}
                      label="Unban user"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function QuestionSection({ questions, now }: { questions: Question[]; now: number }) {
  return (
    <section aria-labelledby="admin-questions">
      <h2 id="admin-questions">Questions</h2>
      {questions.length === 0 ? (
        <p>No questions.</p>
      ) : (
        <ul>
          {questions.map((question) => (
            <li key={question.id}>
              <p>{question.body}</p>
              <p>
                ID: {question.id}. Creator: {question.creatorUserId}. State:{' '}
                {getQuestionState(question, now)}. Created: {formatTime(question.createdAt)}.
                Updated: {formatTime(question.updatedAt)}.
              </p>
              <ConfirmForm
                action={`${ADMIN_PATH}/questions/${encodeURIComponent(question.id)}/delete`}
                label="Delete question"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AnswerSection({ answers }: { answers: AdminDashboard['answers'] }) {
  return (
    <section aria-labelledby="admin-answers">
      <h2 id="admin-answers">Answers</h2>
      {answers.length === 0 ? (
        <p>No answers.</p>
      ) : (
        <ul>
          {answers.map((answer) => (
            <li key={answer.id}>
              <p>{answer.excerpt}</p>
              <p>{answer.body}</p>
              <p>
                ID: {answer.id}. Question: {answer.questionId}. User: {answer.userId}. Created:{' '}
                {formatTime(answer.createdAt)}. Updated: {formatTime(answer.updatedAt)}.
              </p>
              <ConfirmForm
                action={`${ADMIN_PATH}/answers/${encodeURIComponent(answer.id)}/delete`}
                label="Delete answer"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AuditSection({ auditLogs }: { auditLogs: AdminDashboard['auditLogs'] }) {
  return (
    <section aria-labelledby="admin-audit-log">
      <h2 id="admin-audit-log">Audit log</h2>
      {auditLogs.length === 0 ? (
        <p>No audit events.</p>
      ) : (
        <table>
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
                <td>{formatTime(log.createdAt)}</td>
                <td>{log.actorUserId}</td>
                <td>{log.action}</td>
                <td>
                  {log.targetType}: {log.targetId}
                </td>
                <td>{log.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function ConfirmForm({ action, label }: { action: string; label: string }) {
  return (
    <form method="post" action={action}>
      <label>
        <input type="checkbox" name="confirm" required /> Confirm {label.toLowerCase()}
      </label>{' '}
      <button type="submit">{label}</button>
    </form>
  );
}

function formatTime(timestamp: number): string {
  return toIsoTimestamp(timestamp);
}
