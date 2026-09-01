import type { Context } from 'hono';
import {
  createQuestionError,
  getSafetyVerificationQuestion,
} from '../domain/verification-question';
export function verificationQuestionRoute(context: Context): Response {
  const question = getSafetyVerificationQuestion(context.req.param('caseId') ?? '');
  if (question === null) {
    const { code, message } = createQuestionError('VERIFICATION_CASE_NOT_FOUND');
    return context.json({ code, message }, 404, { 'Cache-Control': 'no-store' });
  }
  return context.json(question, 200, { 'Cache-Control': 'no-store' });
}
