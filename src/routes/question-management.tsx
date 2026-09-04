import type { Context } from 'hono';
import type { Authentication } from '../auth/session';
import { readCurrentIdentity } from '../auth/session';
import type { Question } from '../domain/question';
import {
  isPublishableQuestion,
  parseQuestionDraftForm,
  type QuestionDraftForm,
  type QuestionFormErrors,
} from '../domain/question-input';
import type { QuestionRepository } from '../repositories/question-repository';
import {
  AuthenticationRequiredPage,
  ConflictPage,
  ManagementUnavailablePage,
  MyQuestionsPage,
  QuestionFormPage,
  QuestionReviewPage,
  QuestionUnavailablePage,
} from '../views/question-management';

const emptyForm: QuestionDraftForm = {
  body: '',
  closesAtLocal: '',
  closesAt: '',
  timeZone: '',
  contentAcknowledged: false,
};

/**
 * Renders the form for creating a question draft.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the creator.
 * @param clientScriptUrl - URL of the browser-side application bundle.
 * @returns The rendered form or an authentication error page.
 */
export async function newQuestionPageRoute(
  context: Context,
  authentication: Authentication | undefined,
  clientScriptUrl: string,
): Promise<Response> {
  const userId = await authenticatedUserId(context, authentication, clientScriptUrl);
  if (userId instanceof Response) return userId;
  return context.html(
    <QuestionFormPage
      clientScriptUrl={clientScriptUrl}
      form={emptyForm}
      creationToken={crypto.randomUUID()}
    />,
  );
}

/**
 * Validates and creates a question draft.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the creator.
 * @param repository - Question repository used to create the draft.
 * @param now - Current timestamp provider.
 * @param clientScriptUrl - URL of the browser-side application bundle.
 * @returns A redirect, the form with errors, or an availability response.
 */
export async function createQuestionRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  now: () => number,
  clientScriptUrl: string,
): Promise<Response> {
  const userId = await authenticatedUserId(context, authentication, clientScriptUrl);
  if (userId instanceof Response) return userId;
  if (repository === undefined) return unavailable(context, clientScriptUrl);
  const timestamp = now();
  const body = await context.req.parseBody();
  const submittedForm = formFromBody(body);
  const creationToken = typeof body.creationToken === 'string' ? body.creationToken : '';
  const intent = body.intent === 'publish' ? 'publish' : body.intent === 'draft' ? 'draft' : null;
  const parsed = parseQuestionDraftForm(body, timestamp);
  if (parsed.kind === 'invalid') {
    return context.html(
      <QuestionFormPage
        clientScriptUrl={clientScriptUrl}
        form={parsed.form}
        errors={parsed.errors}
        creationToken={creationToken}
      />,
      400,
    );
  }
  if (!isUuid(creationToken) || intent === null) {
    return context.html(
      <QuestionFormPage
        clientScriptUrl={clientScriptUrl}
        form={submittedForm}
        creationToken={creationToken}
        errors={{ form: 'This form is invalid. Reload the page and try again.' }}
      />,
      400,
    );
  }
  const result = await repository.createQuestion(
    { creatorUserId: userId, questionId: creationToken, intent, ...parsed.value },
    timestamp,
  );
  if (result.kind === 'created' || result.kind === 'reused') {
    return context.redirect(
      intent === 'publish'
        ? `/questions/${encodeURIComponent(result.question.id)}`
        : `/questions/${encodeURIComponent(result.question.id)}/review`,
      303,
    );
  }
  if (result.kind === 'conflict')
    return context.html(
      <ConflictPage
        clientScriptUrl={clientScriptUrl}
        message="This form has already been used. Reload and try again."
      />,
      409,
    );
  return unavailable(context, clientScriptUrl);
}

/**
 * Deletes a draft owned by the current user.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the owner.
 * @param repository - Question repository used to delete the draft.
 * @param now - Current timestamp provider.
 * @param clientScriptUrl - URL of the browser-side application bundle.
 * @returns A redirect or a conflict, authentication, or availability response.
 */
export async function deleteQuestionRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  now: () => number,
  clientScriptUrl: string,
): Promise<Response> {
  const userId = await authenticatedUserId(context, authentication, clientScriptUrl);
  if (userId instanceof Response) return userId;
  if (repository === undefined) return unavailable(context, clientScriptUrl);
  const body = await context.req.parseBody();
  if (body.confirmDeletion !== 'on')
    return context.text('Confirm that you want to permanently delete this question.', 400);
  const expectedUpdatedAt = parseSafeInteger(body.expectedUpdatedAt);
  if (expectedUpdatedAt === null)
    return context.text('Question changed. Review it and try again.', 409);
  const questionId = context.req.param('questionId');
  if (questionId === undefined) return questionUnavailable(context, clientScriptUrl);
  const result = await repository.deleteOwnedQuestion(questionId, userId, expectedUpdatedAt, now());
  if (result.kind === 'deleted') return context.redirect('/my/questions?deleted=1', 303);
  if (result.kind === 'missing') return questionUnavailable(context, clientScriptUrl);
  if (result.kind === 'conflict')
    return context.text('Question changed. Review it and try again.', 409);
  return unavailable(context, clientScriptUrl);
}

/**
 * Renders the edit form for a draft owned by the current user.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the owner.
 * @param repository - Question repository used to load the draft.
 * @param clientScriptUrl - URL of the browser-side application bundle.
 * @returns The rendered edit form or an error page.
 */
export async function editQuestionPageRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  clientScriptUrl: string,
): Promise<Response> {
  const owned = await ownedQuestion(context, authentication, repository, clientScriptUrl);
  if (owned instanceof Response) return owned;
  if (owned.publishedAt !== null) return alreadyPublished(context, clientScriptUrl, owned.id);
  return context.html(
    <QuestionFormPage
      clientScriptUrl={clientScriptUrl}
      form={formFromQuestion(owned)}
      question={owned}
    />,
  );
}

/**
 * Validates and updates a draft owned by the current user.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the owner.
 * @param repository - Question repository used to update the draft.
 * @param now - Current timestamp provider.
 * @param clientScriptUrl - URL of the browser-side application bundle.
 * @returns A redirect, the form with errors, or an availability response.
 */
export async function updateQuestionRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  now: () => number,
  clientScriptUrl: string,
): Promise<Response> {
  const owned = await ownedQuestion(context, authentication, repository, clientScriptUrl);
  if (owned instanceof Response) return owned;
  if (owned.publishedAt !== null) return alreadyPublished(context, clientScriptUrl, owned.id);
  const timestamp = now();
  const body = await context.req.parseBody();
  const parsed = parseQuestionDraftForm(body, timestamp);
  if (parsed.kind === 'invalid') {
    return context.html(
      <QuestionFormPage
        clientScriptUrl={clientScriptUrl}
        form={parsed.form}
        errors={parsed.errors}
        question={owned}
      />,
      400,
    );
  }
  const expectedUpdatedAt = parseSafeInteger(body.expectedUpdatedAt);
  if (expectedUpdatedAt === null) {
    return stale(context, clientScriptUrl, owned.id);
  }
  const result = await repository?.updateDraft(
    {
      questionId: owned.id,
      creatorUserId: owned.creatorUserId,
      expectedUpdatedAt,
      ...parsed.value,
    },
    timestamp,
  );
  if (result?.kind === 'updated') {
    return context.redirect(`/questions/${encodeURIComponent(owned.id)}/review`, 303);
  }
  if (result?.kind === 'already-published')
    return alreadyPublished(context, clientScriptUrl, owned.id);
  if (result?.kind === 'conflict') return stale(context, clientScriptUrl, owned.id);
  if (result?.kind === 'unavailable-to-owner') return questionUnavailable(context, clientScriptUrl);
  return unavailable(context, clientScriptUrl);
}

/**
 * Renders the pre-publication review page for an owned draft.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the owner.
 * @param repository - Question repository used to load the draft.
 * @param clientScriptUrl - URL of the browser-side application bundle.
 * @returns The rendered review page or an error page.
 */
export async function reviewQuestionRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  clientScriptUrl: string,
): Promise<Response> {
  const owned = await ownedQuestion(context, authentication, repository, clientScriptUrl);
  if (owned instanceof Response) return owned;
  if (owned.publishedAt !== null) return alreadyPublished(context, clientScriptUrl, owned.id);
  return context.html(<QuestionReviewPage clientScriptUrl={clientScriptUrl} question={owned} />);
}

/**
 * Publishes an owned draft after validating its latest state.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the owner.
 * @param repository - Question repository used to publish the draft.
 * @param now - Current timestamp provider.
 * @param clientScriptUrl - URL of the browser-side application bundle.
 * @returns A redirect or a validation, conflict, or availability response.
 */
export async function publishQuestionRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  now: () => number,
  clientScriptUrl: string,
): Promise<Response> {
  const owned = await ownedQuestion(context, authentication, repository, clientScriptUrl);
  if (owned instanceof Response) return owned;
  if (owned.publishedAt !== null) return alreadyPublished(context, clientScriptUrl, owned.id);
  const body = await context.req.parseBody();
  const errors: QuestionFormErrors = {};
  if (body.confirmPublication !== 'on') {
    errors.confirmPublication = 'Confirm that you want to publish this question.';
  }
  const expectedUpdatedAt = parseSafeInteger(body.expectedUpdatedAt);
  if (expectedUpdatedAt === null || expectedUpdatedAt !== owned.updatedAt) {
    return stale(context, clientScriptUrl, owned.id);
  }
  const timestamp = now();
  if (!isPublishableQuestion(owned, timestamp)) {
    errors.form = 'Choose a deadline between 1 hour and 30 days from now.';
  }
  if (Object.keys(errors).length > 0) {
    return context.html(
      <QuestionReviewPage clientScriptUrl={clientScriptUrl} question={owned} errors={errors} />,
      400,
    );
  }
  const result = await repository?.publish(
    owned.id,
    owned.creatorUserId,
    timestamp,
    expectedUpdatedAt,
  );
  if (result?.kind === 'published') {
    return context.redirect(`/questions/${encodeURIComponent(owned.id)}`, 303);
  }
  if (result?.kind === 'missing' || result?.kind === 'creator-mismatch') {
    return questionUnavailable(context, clientScriptUrl);
  }
  if (result?.kind === 'invalid-transition') {
    const latest = await repository?.getOwnedQuestion(owned.id, owned.creatorUserId);
    return latest?.publishedAt === null
      ? stale(context, clientScriptUrl, owned.id)
      : alreadyPublished(context, clientScriptUrl, owned.id);
  }
  return unavailable(context, clientScriptUrl);
}

/**
 * Renders all questions owned by the current user.
 * @param context - Hono request context.
 * @param authentication - Authentication service used to resolve the owner.
 * @param repository - Question repository used to load owned questions.
 * @param now - Current timestamp provider.
 * @param clientScriptUrl - URL of the browser-side application bundle.
 * @returns The rendered management list or an error page.
 */
export async function myQuestionsRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  now: () => number,
  clientScriptUrl: string,
): Promise<Response> {
  const userId = await authenticatedUserId(context, authentication, clientScriptUrl);
  if (userId instanceof Response) return userId;
  if (repository === undefined) return unavailable(context, clientScriptUrl);
  try {
    const items = await repository.listByCreator(userId);
    return context.html(
      <MyQuestionsPage
        clientScriptUrl={clientScriptUrl}
        items={items}
        now={now()}
        deleted={context.req.query('deleted') === '1'}
      />,
    );
  } catch {
    return unavailable(context, clientScriptUrl);
  }
}

async function authenticatedUserId(
  context: Context,
  authentication: Authentication | undefined,
  clientScriptUrl: string,
): Promise<string | Response> {
  const identity = await readCurrentIdentity(authentication, context.req.raw);
  if (!('code' in identity)) return identity.userId;
  return identity.code === 'AUTHENTICATION_REQUIRED'
    ? context.html(<AuthenticationRequiredPage clientScriptUrl={clientScriptUrl} />, 401)
    : unavailable(context, clientScriptUrl);
}

async function ownedQuestion(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  clientScriptUrl: string,
): Promise<Question | Response> {
  const userId = await authenticatedUserId(context, authentication, clientScriptUrl);
  if (userId instanceof Response) return userId;
  const questionId = context.req.param('questionId');
  if (repository === undefined || questionId === undefined) {
    return questionUnavailable(context, clientScriptUrl);
  }
  try {
    return (
      (await repository.getOwnedQuestion(questionId, userId)) ??
      questionUnavailable(context, clientScriptUrl)
    );
  } catch {
    return unavailable(context, clientScriptUrl);
  }
}

function formFromQuestion(question: Question): QuestionDraftForm {
  return {
    body: question.body,
    closesAtLocal: '',
    closesAt: String(question.closesAt),
    timeZone: '',
    contentAcknowledged: false,
  };
}

function formFromBody(body: Record<string, unknown>): QuestionDraftForm {
  return {
    body: typeof body.body === 'string' ? body.body : '',
    closesAtLocal: typeof body.closesAtLocal === 'string' ? body.closesAtLocal : '',
    closesAt: typeof body.closesAt === 'string' ? body.closesAt : '',
    timeZone: typeof body.timeZone === 'string' ? body.timeZone : '',
    contentAcknowledged: body.contentAcknowledged === 'on',
  };
}

function parseSafeInteger(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function questionUnavailable(context: Context, clientScriptUrl: string): Promise<Response> {
  return await context.html(<QuestionUnavailablePage clientScriptUrl={clientScriptUrl} />, 404);
}

async function unavailable(context: Context, clientScriptUrl: string): Promise<Response> {
  return await context.html(<ManagementUnavailablePage clientScriptUrl={clientScriptUrl} />, 503);
}

async function stale(
  context: Context,
  clientScriptUrl: string,
  questionId: string,
): Promise<Response> {
  return await context.html(
    <ConflictPage
      clientScriptUrl={clientScriptUrl}
      message="This draft changed. Review the latest version and try again."
      questionId={questionId}
    />,
    409,
  );
}

async function alreadyPublished(
  context: Context,
  clientScriptUrl: string,
  questionId: string,
): Promise<Response> {
  return await context.html(
    <ConflictPage
      clientScriptUrl={clientScriptUrl}
      message="This question has already been published."
      questionId={questionId}
    />,
    409,
  );
}
