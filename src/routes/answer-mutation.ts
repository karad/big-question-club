import type { Context } from 'hono';
import { readCurrentIdentity, type Authentication } from '../auth/session';
import { answerError, parseSubmissionInput } from '../domain/answer-submission';
import { toIsoTimestamp } from '../domain/question';
import type { QuestionRepository } from '../repositories/question-repository';

export async function updateAnswerRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  now: () => number,
): Promise<Response> {
  const identity = await readCurrentIdentity(authentication, context.req.raw);
  if ('code' in identity)
    return context.json(answerError('AUTHENTICATION_REQUIRED'), 401, noStore());
  if (repository === undefined) return unavailable(context);
  const input = parseSubmissionInput(await context.req.json().catch(() => null));
  if ('code' in input) return context.json(input, 400, noStore());
  const questionId = context.req.param('questionId');
  if (questionId === undefined)
    return context.json(answerError('QUESTION_NOT_FOUND'), 404, noStore());
  const result = await repository.updateAnswer(questionId, identity.userId, input, now());
  if (result.kind === 'updated')
    return context.json(
      { questionId, status: 'updated', updatedAt: toIsoTimestamp(result.answer.updatedAt) },
      200,
      noStore(),
    );
  return mutationError(context, result.kind);
}

export async function removeAnswerRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  now: () => number,
): Promise<Response> {
  const identity = await readCurrentIdentity(authentication, context.req.raw);
  if ('code' in identity)
    return context.json(answerError('AUTHENTICATION_REQUIRED'), 401, noStore());
  if (repository === undefined) return unavailable(context);
  const questionId = context.req.param('questionId');
  if (questionId === undefined)
    return context.json(answerError('QUESTION_NOT_FOUND'), 404, noStore());
  const timestamp = now();
  const result = await repository.removeAnswer(questionId, identity.userId, timestamp);
  if (result.kind === 'removed')
    return context.json(
      { questionId, status: 'removed', removedAt: toIsoTimestamp(timestamp) },
      200,
      noStore(),
    );
  return mutationError(context, result.kind);
}

function mutationError(context: Context, kind: string): Response {
  if (kind === 'missing') return context.json(answerError('QUESTION_NOT_FOUND'), 404, noStore());
  if (kind === 'answer-missing')
    return context.json(answerError('ANSWER_NOT_FOUND'), 404, noStore());
  if (kind === 'not-open') return context.json(answerError('QUESTION_CLOSED'), 409, noStore());
  if (kind === 'invalid') return context.json(answerError('INVALID_INPUT'), 400, noStore());
  return unavailable(context);
}

function unavailable(context: Context): Response {
  return context.json(answerError('TOOL_UNAVAILABLE'), 500, noStore());
}

function noStore(): { 'Cache-Control': string } {
  return { 'Cache-Control': 'no-store' };
}
