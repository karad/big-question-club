import type { Context } from 'hono';
import {
  createQuestionError,
  getSafetyVerificationQuestion,
} from '../domain/verification-question';
/**
 * Returns one configured safety-verification question.
 * @param context - Hono request context containing the requested case ID.
 * @returns An HTTP response containing a question or structured error.
 */
export function verificationQuestionRoute(context: Context): Response {
  const question = getSafetyVerificationQuestion(context.req.param('caseId') ?? '');
  if (question === null) {
    const { code, message } = createQuestionError('VERIFICATION_CASE_NOT_FOUND');
    return context.json({ code, message }, 404, { 'Cache-Control': 'no-store' });
  }
  return context.json(question, 200, { 'Cache-Control': 'no-store' });
}
