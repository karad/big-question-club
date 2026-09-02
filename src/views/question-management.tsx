import type { Question, QuestionLanguage, QuestionState } from '../domain/question';
import { toIsoTimestamp } from '../domain/question';
import type { QuestionDraftForm, QuestionFormErrors } from '../domain/question-input';
import { getQuestionState } from '../domain/question-lifecycle';
import type { OwnedQuestionSummary } from '../repositories/question-repository';

type LayoutProps = {
  title: string;
  clientScriptUrl: string;
  children: unknown;
};

export function QuestionManagementLayout({ title, clientScriptUrl, children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title} — Big Question Club</title>
      </head>
      <body>
        <header>
          <nav aria-label="Question management">
            <a href="/questions/new">Create a question</a> <a href="/my/questions">My Questions</a>
          </nav>
        </header>
        <main>{children}</main>
        <script type="module" src={clientScriptUrl} />
      </body>
    </html>
  );
}

export function AuthenticationRequiredPage({ clientScriptUrl }: { clientScriptUrl: string }) {
  return (
    <QuestionManagementLayout title="Sign in" clientScriptUrl={clientScriptUrl}>
      <h1>Sign in to manage questions.</h1>
      <a href="/">Go to sign in</a>
    </QuestionManagementLayout>
  );
}

export function QuestionUnavailablePage({ clientScriptUrl }: { clientScriptUrl: string }) {
  return (
    <QuestionManagementLayout title="Question unavailable" clientScriptUrl={clientScriptUrl}>
      <h1>Question unavailable.</h1>
      <a href="/my/questions">Back to My Questions</a>
    </QuestionManagementLayout>
  );
}

export function ManagementUnavailablePage({ clientScriptUrl }: { clientScriptUrl: string }) {
  return (
    <QuestionManagementLayout title="Temporarily unavailable" clientScriptUrl={clientScriptUrl}>
      <h1>Question management is temporarily unavailable. Try again.</h1>
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
      <h1>{message}</h1>
      {questionId === undefined ? null : (
        <a href={`/questions/${encodeURIComponent(questionId)}/review`}>Review latest version</a>
      )}
    </QuestionManagementLayout>
  );
}

export function QuestionFormPage({
  clientScriptUrl,
  form,
  errors = {},
  question,
}: {
  clientScriptUrl: string;
  form: QuestionDraftForm;
  errors?: QuestionFormErrors;
  question?: Question;
}) {
  const editing = question !== undefined;
  const action = editing ? `/questions/${encodeURIComponent(question.id)}/edit` : '/questions';
  return (
    <QuestionManagementLayout
      title={editing ? 'Edit question' : 'Create a question'}
      clientScriptUrl={clientScriptUrl}
    >
      <h1>{editing ? 'Edit question' : 'Create a question'}</h1>
      <ErrorSummary errors={errors} />
      <form method="post" action={action} data-question-form>
        {editing ? (
          <input type="hidden" name="expectedUpdatedAt" value={String(question.updatedAt)} />
        ) : null}
        <div>
          <label for="question-body">Question</label>
          <textarea
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
          <p id="question-count" role="status" data-question-count>
            0 / 1,000 characters
          </p>
          <FieldError id="body-error" message={errors.body} />
        </div>
        <fieldset aria-describedby={errors.language === undefined ? undefined : 'language-error'}>
          <legend>Primary language</legend>
          <LanguageOption value="en" label="English" selected={form.language === 'en'} />
          <LanguageOption value="ja" label="Japanese" selected={form.language === 'ja'} />
          <FieldError id="language-error" message={errors.language} />
        </fieldset>
        <div>
          <label for="question-deadline">Answer deadline</label>
          <input
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
              errors.closesAt === undefined ? 'deadline-details' : 'closesAt-error deadline-details'
            }
          />
          <input type="hidden" name="closesAt" value={form.closesAt} data-closes-at-value />
          <input type="hidden" name="timeZone" value={form.timeZone} data-time-zone-value />
          <p id="deadline-details">
            Time zone: <span data-time-zone>{form.timeZone || 'Detecting…'}</span>. UTC deadline:{' '}
            <span data-utc-deadline>{formatTimestamp(form.closesAt)}</span>.
          </p>
          <FieldError id="closesAt-error" message={errors.closesAt} />
        </div>
        <div>
          <input
            id="content-acknowledged"
            name="contentAcknowledged"
            type="checkbox"
            checked={form.contentAcknowledged}
            aria-invalid={errors.contentAcknowledged === undefined ? undefined : 'true'}
            aria-describedby={
              errors.contentAcknowledged === undefined ? undefined : 'contentAcknowledged-error'
            }
          />
          <label for="content-acknowledged">
            I understand this question will be public and must not include personal, confidential,
            or harmful content.
          </label>
          <FieldError id="contentAcknowledged-error" message={errors.contentAcknowledged} />
        </div>
        <button type="submit">Save draft</button>
      </form>
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
      <h1>Review question</h1>
      <ErrorSummary errors={errors} />
      <p>{question.body}</p>
      <dl>
        <dt>Primary language</dt>
        <dd>{question.language === 'ja' ? 'Japanese' : 'English'}</dd>
        <dt>Answer deadline</dt>
        <dd>
          <time dateTime={toIsoTimestamp(question.closesAt)} data-deadline-display>
            {toIsoTimestamp(question.closesAt)}
          </time>
        </dd>
        <dt>Time zone</dt>
        <dd data-review-time-zone>Detecting…</dd>
        <dt>UTC deadline</dt>
        <dd>{toIsoTimestamp(question.closesAt)}</dd>
      </dl>
      <p>Answers remain sealed until the deadline.</p>
      <p>You cannot edit this question after publishing.</p>
      <a href={`/questions/${encodeURIComponent(question.id)}/edit`}>Edit</a>
      <form method="post" action={`/questions/${encodeURIComponent(question.id)}/publish`}>
        <input type="hidden" name="expectedUpdatedAt" value={String(question.updatedAt)} />
        <div>
          <input
            id="confirm-publication"
            name="confirmPublication"
            type="checkbox"
            aria-invalid={errors.confirmPublication === undefined ? undefined : 'true'}
            aria-describedby={
              errors.confirmPublication === undefined ? undefined : 'confirmPublication-error'
            }
          />
          <label for="confirm-publication">
            I have reviewed this question and want to publish it.
          </label>
          <FieldError id="confirmPublication-error" message={errors.confirmPublication} />
        </div>
        <button type="submit">Publish question</button>
      </form>
    </QuestionManagementLayout>
  );
}

export function MyQuestionsPage({
  clientScriptUrl,
  items,
  now,
}: {
  clientScriptUrl: string;
  items: OwnedQuestionSummary[];
  now: number;
}) {
  return (
    <QuestionManagementLayout title="My Questions" clientScriptUrl={clientScriptUrl}>
      <h1>My Questions</h1>
      {items.length === 0 ? (
        <section>
          <p>You haven't created any questions yet.</p>
          <a href="/questions/new">Create a question</a>
        </section>
      ) : (
        <ol>
          {items.map(({ question, answerCount }) => (
            <li key={question.id}>
              <h2>{excerpt(question.body)}</h2>
              <p>Status: {questionState(question, now)}</p>
              <p>
                Deadline:{' '}
                <time dateTime={toIsoTimestamp(question.closesAt)}>
                  {toIsoTimestamp(question.closesAt)}
                </time>
              </p>
              <p>Answers: {answerCount}</p>
              {question.publishedAt === null ? (
                <p>
                  <a href={`/questions/${encodeURIComponent(question.id)}/edit`}>Edit</a>{' '}
                  <a href={`/questions/${encodeURIComponent(question.id)}/review`}>
                    Review and publish
                  </a>
                </p>
              ) : (
                <a href={`/questions/${encodeURIComponent(question.id)}`}>View question</a>
              )}
            </li>
          ))}
        </ol>
      )}
    </QuestionManagementLayout>
  );
}

function ErrorSummary({ errors }: { errors: QuestionFormErrors }) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;
  return (
    <section role="alert" aria-labelledby="error-summary-title">
      <h2 id="error-summary-title">Fix the following errors</h2>
      <ul>
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
    <p id={id} role="alert">
      {message}
    </p>
  );
}

function LanguageOption({
  value,
  label,
  selected,
}: {
  value: QuestionLanguage;
  label: string;
  selected: boolean;
}) {
  return (
    <label>
      <input type="radio" name="language" value={value} checked={selected} /> {label}
    </label>
  );
}

function formatTimestamp(value: string): string {
  const timestamp = Number(value);
  return Number.isSafeInteger(timestamp) && timestamp > 0
    ? toIsoTimestamp(timestamp)
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
  if (key === 'language') return 'language-error';
  if (key === 'closesAt') return 'question-deadline';
  if (key === 'contentAcknowledged') return 'content-acknowledged';
  if (key === 'confirmPublication') return 'confirm-publication';
  return 'error-summary-title';
}
