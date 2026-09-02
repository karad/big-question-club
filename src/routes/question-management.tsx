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

export async function newQuestionPageRoute(
  context: Context,
  authentication: Authentication | undefined,
  clientScriptUrl: string,
): Promise<Response> {
  const userId = await authenticatedUserId(context, authentication, clientScriptUrl);
  if (userId instanceof Response) return userId;
  return context.html(<QuestionFormPage clientScriptUrl={clientScriptUrl} form={emptyForm} />);
}

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
  const parsed = parseQuestionDraftForm(await context.req.parseBody(), timestamp);
  if (parsed.kind === 'invalid') {
    return context.html(
      <QuestionFormPage
        clientScriptUrl={clientScriptUrl}
        form={parsed.form}
        errors={parsed.errors}
      />,
      400,
    );
  }
  const result = await repository.createDraft(
    { creatorUserId: userId, ...parsed.value },
    timestamp,
  );
  if (result.kind === 'created') {
    return context.redirect(`/questions/${encodeURIComponent(result.question.id)}/review`, 303);
  }
  return unavailable(context, clientScriptUrl);
}

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
      <MyQuestionsPage clientScriptUrl={clientScriptUrl} items={items} now={now()} />,
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

function parseSafeInteger(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
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
