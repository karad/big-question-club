import type { Context } from 'hono';
import { readCurrentIdentity, type Authentication } from '../auth/session';
import { answerError } from '../domain/answer-submission';
import { canListAnswerExcerpts, canReadOtherAnswerBody } from '../domain/answer-visibility';
import { toIsoTimestamp } from '../domain/question';
import { getQuestionState } from '../domain/question-lifecycle';
import type { QuestionRepository } from '../repositories/question-repository';

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
      character,
  );
}

export async function questionRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
): Promise<Response> {
  if (repository === undefined)
    return context.json(answerError('ANSWER_UNAVAILABLE'), 404, { 'Cache-Control': 'no-store' });
  const questionId = context.req.param('questionId');
  if (questionId === undefined)
    return context.json(answerError('QUESTION_NOT_FOUND'), 404, { 'Cache-Control': 'no-store' });
  const question = await repository.getQuestion(questionId);
  if (question === null)
    return context.json(answerError('QUESTION_NOT_FOUND'), 404, { 'Cache-Control': 'no-store' });
  const identity = await readCurrentIdentity(authentication, context.req.raw);
  const mine = 'code' in identity ? null : await repository.getMine(questionId, identity.userId);
  return context.json(
    {
      id: question.id,
      question: question.body,
      answerCount: await repository.countAnswers(questionId),
      closesAt: toIsoTimestamp(question.closesAt),
      mySubmissionStatus: mine === null ? 'not_submitted' : 'submitted',
    },
    200,
    { 'Cache-Control': 'no-store' },
  );
}

export async function mySubmissionRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
): Promise<Response> {
  if (repository === undefined)
    return context.json(answerError('ANSWER_UNAVAILABLE'), 404, { 'Cache-Control': 'no-store' });
  const identity = await readCurrentIdentity(authentication, context.req.raw);
  if ('code' in identity)
    return context.json(answerError('AUTHENTICATION_REQUIRED'), 401, {
      'Cache-Control': 'no-store',
    });
  const questionId = context.req.param('questionId');
  if (questionId === undefined || (await repository.getQuestion(questionId)) === null)
    return context.json(answerError('QUESTION_NOT_FOUND'), 404, { 'Cache-Control': 'no-store' });
  const answer = await repository.getMine(questionId, identity.userId);
  return context.json(
    answer === null
      ? { questionId, status: 'not_submitted' }
      : {
          questionId,
          status: 'submitted',
          answer: answer.body,
          excerpt: answer.excerpt,
          submittedAt: toIsoTimestamp(answer.createdAt),
        },
    200,
    { 'Cache-Control': 'no-store' },
  );
}

export async function answerDetailRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  now: () => number,
): Promise<Response> {
  const identity = await readCurrentIdentity(authentication, context.req.raw);
  const questionId = context.req.param('questionId');
  const answerId = context.req.param('answerId');
  if (
    'code' in identity ||
    repository === undefined ||
    questionId === undefined ||
    answerId === undefined
  )
    return context.json(answerError('ANSWER_UNAVAILABLE'), 404, { 'Cache-Control': 'no-store' });
  const question = await repository.getQuestion(questionId);
  const state = question === null ? null : getQuestionState(question, now());
  if (question === null || state === null || !canReadOtherAnswerBody(true, 'detail', state))
    return context.json(answerError('ANSWER_UNAVAILABLE'), 404, { 'Cache-Control': 'no-store' });
  const body = await repository.getAnswerBody(questionId, answerId);
  return body === null
    ? context.json(answerError('ANSWER_UNAVAILABLE'), 404, { 'Cache-Control': 'no-store' })
    : context.json({ id: answerId, body }, 200, { 'Cache-Control': 'no-store' });
}

export async function questionPageRoute(
  context: Context,
  authentication: Authentication | undefined,
  repository: QuestionRepository | undefined,
  now: () => number,
  clientScriptUrl: string,
): Promise<Response> {
  const identity = await readCurrentIdentity(authentication, context.req.raw);
  const questionId = context.req.param('questionId');
  if ('code' in identity || repository === undefined || questionId === undefined)
    return context.text('Sign in to view answers.', 401);
  const question = await repository.getQuestion(questionId);
  if (question === null) return context.text('Question unavailable.', 404);
  const state = getQuestionState(question, now());
  const revealed = state === 'REVEALED';
  const mine = await repository.getMine(questionId, identity.userId);
  const excerpts = canListAnswerExcerpts(true, state)
    ? await repository.listExcerpts(questionId)
    : [];
  const items = excerpts
    .map(
      (answer) =>
        `<li><button type="button" data-answer-id="${escapeHtml(answer.id)}">${escapeHtml(answer.excerpt)}</button><p id="answer-${escapeHtml(answer.id)}" hidden></p></li>`,
    )
    .join('');
  const ownAnswer =
    !revealed && mine !== null
      ? `<section><h2>Your answer</h2><p>${escapeHtml(mine.excerpt)}</p><p>${escapeHtml(mine.body)}</p></section>`
      : '';
  const answerContent = revealed
    ? items || '<li>No answers have been submitted.</li>'
    : 'Answers are sealed.';
  return context.html(
    `<!doctype html><html lang="en"><body><main><h1>${escapeHtml(question.body)}</h1><p>Answers submitted: ${await repository.countAnswers(questionId)}</p><p>${revealed ? 'Answers are available.' : 'Answers are sealed.'}</p>${ownAnswer}<ul>${answerContent}</ul></main><script type="module" src="${escapeHtml(clientScriptUrl)}"></script></body></html>`,
  );
}
