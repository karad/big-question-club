import type { Question, QuestionState } from '../domain/question';
import type { Child } from 'hono/jsx';
import { formatUtcDateTime } from '../domain/date-time';
import { toIsoTimestamp } from '../domain/question';
import type { QuestionDraftForm, QuestionFormErrors } from '../domain/question-input';
import { getQuestionState } from '../domain/question-lifecycle';
import type { OwnedQuestionSummary } from '../repositories/question-repository';
import { SiteLayout } from './layout';
import { Icon } from './icon';

type LayoutProps = {
  title: string;
  clientScriptUrl: string;
  children: Child;
  currentPage?: 'my-questions';
};

export function QuestionManagementLayout({
  title,
  clientScriptUrl,
  children,
  currentPage,
}: LayoutProps) {
  return (
    <SiteLayout
      title={title}
      clientScriptUrl={clientScriptUrl}
      navigation={
        <>
          <a href="/">Home</a>
          <a href="/questions/new">Create a question</a>
          {currentPage === 'my-questions' ? null : <a href="/my/questions">My Questions</a>}
        </>
      }
    >
      {children}
    </SiteLayout>
  );
}

export function AuthenticationRequiredPage({ clientScriptUrl }: { clientScriptUrl: string }) {
  return (
    <QuestionManagementLayout title="Sign in" clientScriptUrl={clientScriptUrl}>
      <section class="paper-card mx-auto max-w-2xl">
        <p class="eyebrow">Account required</p>
        <h1 class="editorial-title mt-2">Sign in to manage questions.</h1>
        <a class="button-primary mt-6" href="/">
          Go to sign in
        </a>
      </section>
    </QuestionManagementLayout>
  );
}

export function QuestionUnavailablePage({ clientScriptUrl }: { clientScriptUrl: string }) {
  return (
    <QuestionManagementLayout title="Question unavailable" clientScriptUrl={clientScriptUrl}>
      <section class="paper-card mx-auto max-w-2xl">
        <p class="eyebrow">Question status</p>
        <h1 class="editorial-title mt-2">Question unavailable.</h1>
        <a class="button-secondary mt-6" href="/my/questions">
          <Icon name="arrowLeft" /> Back to My Questions
        </a>
      </section>
    </QuestionManagementLayout>
  );
}

export function ManagementUnavailablePage({ clientScriptUrl }: { clientScriptUrl: string }) {
  return (
    <QuestionManagementLayout title="Temporarily unavailable" clientScriptUrl={clientScriptUrl}>
      <section class="paper-card mx-auto max-w-2xl">
        <p class="eyebrow">Temporary interruption</p>
        <h1 class="editorial-title mt-2">
          Question management is temporarily unavailable. Try again.
        </h1>
      </section>
    </QuestionManagementLayout>
  );
}

export function ConflictPage({
  clientScriptUrl,
  message,
  questionId,
}: {
  clientScriptUrl: string;
  message: string;
  questionId?: string;
}) {
  return (
    <QuestionManagementLayout title="Question changed" clientScriptUrl={clientScriptUrl}>
      <section class="paper-card mx-auto max-w-2xl">
        <p class="eyebrow">Question changed</p>
        <h1 class="editorial-title mt-2">{message}</h1>
        {questionId === undefined ? null : (
          <a
            class="button-primary mt-6"
            href={`/questions/${encodeURIComponent(questionId)}/review`}
          >
            Review latest version
          </a>
        )}
      </section>
    </QuestionManagementLayout>
  );
}

export function QuestionFormPage({
  clientScriptUrl,
  form,
  errors = {},
  question,
  creationToken,
}: {
  clientScriptUrl: string;
  form: QuestionDraftForm;
  errors?: QuestionFormErrors;
  question?: Question;
  creationToken?: string;
}) {
  const editing = question !== undefined;
  const action = editing ? `/questions/${encodeURIComponent(question.id)}/edit` : '/questions';
  return (
    <QuestionManagementLayout
      title={editing ? 'Edit question' : 'Create a question'}
      clientScriptUrl={clientScriptUrl}
    >
      <div class="mx-auto max-w-3xl">
        <p class="eyebrow mb-2">Shape the conversation</p>
        <h1 class="editorial-title">{editing ? 'Edit question' : 'Create a question'}</h1>
        <ErrorSummary errors={errors} />
        <form
          class="paper-card mt-8 space-y-7 sm:p-8"
          method="post"
          action={action}
          data-question-form
          data-submission-guard
        >
          {!editing ? (
            <>
              <input type="hidden" name="creationToken" value={creationToken} />
              <input type="hidden" name="intent" value="" data-submit-intent />
            </>
          ) : null}
          {editing ? (
            <input type="hidden" name="expectedUpdatedAt" value={String(question.updatedAt)} />
          ) : null}
          <div>
            <label for="question-body">Question</label>
            <textarea
              class="mt-2 min-h-40 w-full rounded-xl border p-4"
              id="question-body"
              name="body"
              required
              aria-invalid={errors.body === undefined ? undefined : 'true'}
              aria-describedby={
                errors.body === undefined ? 'question-count' : 'body-error question-count'
              }
            >
              {form.body}
            </textarea>
            <p
              class="mt-2 text-sm text-ink-muted"
              id="question-count"
              role="status"
              data-question-count
            >
              0 / 1,000 characters
            </p>
            <FieldError id="body-error" message={errors.body} />
          </div>
          <div>
            <label for="question-deadline">Answer deadline</label>
            <input
              class="mt-2 w-full rounded-xl border p-3"
              id="question-deadline"
              name="closesAtLocal"
              type="datetime-local"
              required
              value={form.closesAtLocal}
              data-closes-at={
                form.closesAt || (question === undefined ? '' : String(question.closesAt))
              }
              aria-invalid={errors.closesAt === undefined ? undefined : 'true'}
              aria-describedby={
                errors.closesAt === undefined
                  ? 'deadline-details'
                  : 'closesAt-error deadline-details'
              }
            />
            <input type="hidden" name="closesAt" value={form.closesAt} data-closes-at-value />
            <input type="hidden" name="timeZone" value={form.timeZone} data-time-zone-value />
            <p class="mt-2 text-sm leading-6 text-ink-muted" id="deadline-details">
              Time zone: <span data-time-zone>{form.timeZone || 'Detecting…'}</span>. UTC deadline:{' '}
              <span data-utc-deadline>{formatTimestamp(form.closesAt)}</span>.
            </p>
            <FieldError id="closesAt-error" message={errors.closesAt} />
          </div>
          <div class="flex items-start gap-3 rounded-xl bg-paper-deep/70 p-4">
            <input
              class="mt-1 size-4 shrink-0 accent-action"
              id="content-acknowledged"
              name="contentAcknowledged"
              type="checkbox"
              checked={form.contentAcknowledged}
              aria-invalid={errors.contentAcknowledged === undefined ? undefined : 'true'}
              aria-describedby={
                errors.contentAcknowledged === undefined ? undefined : 'contentAcknowledged-error'
              }
            />
            <label class="text-sm leading-6" for="content-acknowledged">
              I understand this question will be public and must not include personal, confidential,
              or harmful content.
            </label>
            <FieldError id="contentAcknowledged-error" message={errors.contentAcknowledged} />
          </div>
          <div class="flex flex-wrap gap-3">
            {editing ? (
              <button class="button-primary" type="submit" data-pending-label="Saving…">
                Save draft
              </button>
            ) : (
              <>
                <button
                  class="button-secondary"
                  type="submit"
                  value="draft"
                  data-pending-label="Saving draft…"
                >
                  <Icon name="edit" />
                  Save as draft
                </button>
                <button
                  class="button-primary"
                  type="submit"
                  value="publish"
                  data-pending-label="Publishing…"
                >
                  <Icon name="unlock" />
                  Publish question
                </button>
              </>
            )}
          </div>
          <p role="status" aria-live="polite" data-submission-status />
        </form>
      </div>
    </QuestionManagementLayout>
  );
}

export function QuestionReviewPage({
  clientScriptUrl,
  question,
  errors = {},
}: {
  clientScriptUrl: string;
  question: Question;
  errors?: QuestionFormErrors;
}) {
  return (
    <QuestionManagementLayout title="Review question" clientScriptUrl={clientScriptUrl}>
      <div class="mx-auto max-w-3xl">
        <p class="eyebrow mb-2">Final check</p>
        <h1 class="editorial-title">Review question</h1>
        <ErrorSummary errors={errors} />
        <article class="paper-card mt-8 sm:p-8">
          <p class="prose-safe font-display text-2xl font-bold leading-snug">{question.body}</p>
          <dl class="mt-7 grid gap-5 border-y border-line py-6 sm:grid-cols-3">
            <div>
              <dt class="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Answer deadline
              </dt>
              <dd class="mt-1 text-sm">
                <time dateTime={toIsoTimestamp(question.closesAt)} data-deadline-display>
                  {formatUtcDateTime(question.closesAt)}
                </time>
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold uppercase tracking-wider text-ink-muted">Time zone</dt>
              <dd class="mt-1 text-sm" data-review-time-zone>
                Detecting…
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold uppercase tracking-wider text-ink-muted">
                UTC deadline
              </dt>
              <dd class="mt-1 text-sm">{formatUtcDateTime(question.closesAt)}</dd>
            </div>
          </dl>
          <div class="mt-6 rounded-xl bg-paper-deep/70 p-4 text-sm leading-6 text-ink-muted">
            <p>Answers remain sealed until the deadline.</p>
            <p>You cannot edit this question after publishing.</p>
          </div>
          <div class="mt-6 flex flex-wrap items-center gap-4">
            <a class="button-secondary" href={`/questions/${encodeURIComponent(question.id)}/edit`}>
              <Icon name="edit" /> Edit
            </a>
            <form
              class="flex flex-wrap items-center gap-4"
              method="post"
              action={`/questions/${encodeURIComponent(question.id)}/publish`}
            >
              <input type="hidden" name="expectedUpdatedAt" value={String(question.updatedAt)} />
              <div>
                <label class="flex items-start gap-2 text-sm">
                  <input
                    class="mt-1 size-4 accent-action"
                    id="confirm-publication"
                    name="confirmPublication"
                    type="checkbox"
                    aria-invalid={errors.confirmPublication === undefined ? undefined : 'true'}
                    aria-describedby={
                      errors.confirmPublication === undefined
                        ? undefined
                        : 'confirmPublication-error'
                    }
                  />
                  I have reviewed this question and want to publish it.
                </label>
                <FieldError id="confirmPublication-error" message={errors.confirmPublication} />
              </div>
              <button class="button-primary" type="submit">
                <Icon name="unlock" /> Publish question
              </button>
            </form>
          </div>
        </article>
      </div>
    </QuestionManagementLayout>
  );
}

export function MyQuestionsPage({
  clientScriptUrl,
  items,
  now,
  deleted = false,
}: {
  clientScriptUrl: string;
  items: OwnedQuestionSummary[];
  now: number;
  deleted?: boolean;
}) {
  return (
    <QuestionManagementLayout
      title="My Questions"
      clientScriptUrl={clientScriptUrl}
      currentPage="my-questions"
    >
      <header class="border-b border-line pb-8 pt-2">
        <p class="eyebrow mb-2">Your questions</p>
        <div class="flex flex-wrap items-end justify-between gap-5">
          <h1 class="editorial-title">My Questions</h1>
          <a class="button-primary" href="/questions/new">
            <Icon name="feather" /> Create a question
          </a>
        </div>
      </header>
      {deleted ? (
        <p class="mt-4 rounded-xl bg-teal-100 p-4 font-semibold text-teal-900" role="status">
          Question deleted.
        </p>
      ) : null}
      {items.length === 0 ? (
        <section class="paper-card mt-8 text-ink-muted">
          <p>You haven't created any questions yet.</p>
          <a class="mt-3 inline-block font-semibold" href="/questions/new">
            Create a question
          </a>
        </section>
      ) : (
        <ol class="mt-8 grid gap-4 md:grid-cols-2">
          {items.map(({ question, answerCount }) => (
            <li class="paper-card" key={question.id}>
              <h2 class="prose-safe font-display text-xl font-bold leading-snug">
                {excerpt(question.body)}
              </h2>
              <p class="mt-4 text-sm font-semibold text-sealed">{questionState(question, now)}</p>
              <p class="mt-2 text-sm text-ink-muted">
                Deadline:{' '}
                <time dateTime={toIsoTimestamp(question.closesAt)}>
                  {formatUtcDateTime(question.closesAt)}
                </time>
              </p>
              <p class="mt-1 text-sm text-ink-muted">Answers: {answerCount}</p>
              {question.publishedAt === null ? (
                <p class="mt-4 flex flex-wrap gap-4 font-semibold">
                  <a href={`/questions/${encodeURIComponent(question.id)}/edit`}>Edit</a>{' '}
                  <a href={`/questions/${encodeURIComponent(question.id)}/review`}>
                    Review and publish
                  </a>
                </p>
              ) : (
                <a
                  class="mt-4 inline-block font-semibold"
                  href={`/questions/${encodeURIComponent(question.id)}`}
                >
                  View question
                </a>
              )}
              <DeleteQuestionForm
                question={question}
                answerCount={answerCount}
                state={questionState(question, now)}
              />
            </li>
          ))}
        </ol>
      )}
    </QuestionManagementLayout>
  );
}

export function DeleteQuestionForm({
  question,
  answerCount,
  state,
}: {
  question: Question;
  answerCount: number;
  state?: QuestionState;
}) {
  return (
    <details class="danger-disclosure mt-5 border-t border-ink/15 pt-4">
      <summary
        class="inline-flex cursor-pointer items-center gap-2 font-semibold text-red-800"
        data-delete-trigger
      >
        <Icon name="trash" />
        Delete question
      </summary>
      <div class="mt-4 rounded-xl bg-red-50 p-4">
        <p class="prose-safe font-semibold">{excerpt(question.body)}</p>
        <p>
          Status: {state ?? (question.publishedAt === null ? 'DRAFT' : 'PUBLISHED')} · Answers:{' '}
          {answerCount}
        </p>
        <p>This permanently deletes the question and all of its answers.</p>
        <form
          class="mt-4 space-y-3"
          method="post"
          action={`/questions/${encodeURIComponent(question.id)}/delete`}
          data-submission-guard
        >
          <input type="hidden" name="expectedUpdatedAt" value={String(question.updatedAt)} />
          <label class="flex gap-2">
            <input name="confirmDeletion" type="checkbox" required /> I understand this cannot be
            undone.
          </label>
          <button class="button-danger" type="submit" data-pending-label="Deleting…">
            <Icon name="trash" />
            Delete permanently
          </button>
          <p role="status" data-submission-status />
        </form>
      </div>
    </details>
  );
}

function ErrorSummary({ errors }: { errors: QuestionFormErrors }) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;
  return (
    <section
      class="mt-6 rounded-xl border border-red-200 bg-red-50 p-5"
      role="alert"
      aria-labelledby="error-summary-title"
    >
      <h2 class="font-display text-xl font-bold text-red-900" id="error-summary-title">
        Fix the following errors
      </h2>
      <ul class="mt-2 list-disc pl-5">
        {entries.map(([key, message]) => (
          <li key={key}>
            {key === 'form' ? message : <a href={`#${errorTarget(key)}`}>{message}</a>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  return message === undefined ? null : (
    <p class="mt-2 text-sm font-semibold text-red-800" id={id} role="alert">
      {message}
    </p>
  );
}

function formatTimestamp(value: string): string {
  const timestamp = Number(value);
  return Number.isSafeInteger(timestamp) && timestamp > 0
    ? formatUtcDateTime(timestamp)
    : 'Choose a deadline';
}

function excerpt(value: string): string {
  const segments = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)];
  return segments.length <= 120
    ? value
    : `${segments
        .slice(0, 120)
        .map(({ segment }) => segment)
        .join('')}…`;
}

function questionState(question: Question, now: number): QuestionState {
  return getQuestionState(question, now);
}

function errorTarget(key: string): string {
  if (key === 'body') return 'question-body';
  if (key === 'closesAt') return 'question-deadline';
  if (key === 'contentAcknowledged') return 'content-acknowledged';
  if (key === 'confirmPublication') return 'confirm-publication';
  return 'error-summary-title';
}
