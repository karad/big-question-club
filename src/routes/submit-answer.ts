import type { Context } from 'hono';
import { answerError, parseSubmissionInput } from '../domain/answer-submission';
import { toIsoTimestamp } from '../domain/question';
import type { QuestionRepository } from '../repositories/question-repository';
import { readCurrentIdentity, type Authentication } from '../auth/session';

export async function submitAnswerRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  now: () => number,
): Promise<Response> {
  const identity = await readCurrentIdentity(authentication, context.req.raw);
  if ('code' in identity)
    return context.json(answerError('AUTHENTICATION_REQUIRED'), 401, {
      'Cache-Control': 'no-store',
    });
  if (repository === undefined)
    return context.json(answerError('TOOL_UNAVAILABLE'), 500, {
      'Cache-Control': 'no-store',
    });
  const input = parseSubmissionInput(await context.req.json().catch(() => null));
  if ('code' in input) return context.json(input, 400, { 'Cache-Control': 'no-store' });
  const questionId = context.req.param('questionId');
  if (questionId === undefined)
    return context.json(answerError('QUESTION_NOT_FOUND'), 404, { 'Cache-Control': 'no-store' });
  const timestamp = now();
  const result = await repository.submit(questionId, identity.userId, input, timestamp);
  if (result.kind === 'duplicate')
    return context.json(answerError('ANSWER_ALREADY_SUBMITTED'), 409, {
      'Cache-Control': 'no-store',
    });
  if (result.kind === 'missing')
    return context.json(answerError('QUESTION_NOT_FOUND'), 404, { 'Cache-Control': 'no-store' });
  if (result.kind === 'not-open')
    return context.json(answerError('QUESTION_CLOSED'), 409, { 'Cache-Control': 'no-store' });
  if (result.kind === 'invalid')
    return context.json(answerError('INVALID_INPUT'), 400, { 'Cache-Control': 'no-store' });
  if (result.kind === 'reference-missing' || result.kind === 'unavailable')
    return context.json(answerError('TOOL_UNAVAILABLE'), 500, {
      'Cache-Control': 'no-store',
    });
  return context.json(
    { questionId, status: 'submitted', submittedAt: toIsoTimestamp(result.answer.createdAt) },
    201,
    { 'Cache-Control': 'no-store' },
  );
}
