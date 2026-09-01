import { MAX_ANSWER_LENGTH, MAX_EXCERPT_LENGTH } from './question';

export type AnswerErrorCode =
  | 'INVALID_ANSWER'
  | 'AUTHENTICATION_REQUIRED'
  | 'QUESTION_NOT_FOUND'
  | 'ANSWER_ALREADY_SUBMITTED'
  | 'QUESTION_CLOSED'
  | 'ANSWER_SUBMISSION_UNAVAILABLE'
  | 'ANSWER_UNAVAILABLE';
export type AnswerError = { code: AnswerErrorCode; message: string };
export type SubmissionInput = { answer: string; excerpt: string };

const messages: Record<AnswerErrorCode, string> = {
  INVALID_ANSWER: 'The answer or excerpt is invalid.',
  AUTHENTICATION_REQUIRED: 'Sign in to submit an answer.',
  QUESTION_NOT_FOUND: 'The requested question is unavailable.',
  ANSWER_ALREADY_SUBMITTED: 'An answer has already been submitted.',
  QUESTION_CLOSED: 'This question is closed.',
  ANSWER_SUBMISSION_UNAVAILABLE: 'Answer submission is temporarily unavailable.',
  ANSWER_UNAVAILABLE: 'The requested answer is unavailable.',
};
export function answerError(code: AnswerErrorCode): AnswerError {
  return { code, message: messages[code] };
}
export function parseSubmissionInput(input: unknown): SubmissionInput | AnswerError {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    return answerError('INVALID_ANSWER');
  const value = input as Record<string, unknown>;
  if (
    Object.keys(value).length !== 2 ||
    typeof value.answer !== 'string' ||
    typeof value.excerpt !== 'string'
  )
    return answerError('INVALID_ANSWER');
  if (
    !value.answer.trim() ||
    value.answer.length > MAX_ANSWER_LENGTH ||
    !value.excerpt.trim() ||
    value.excerpt.length > MAX_EXCERPT_LENGTH ||
    /[\r\n]/.test(value.excerpt)
  )
    return answerError('INVALID_ANSWER');
  return { answer: value.answer, excerpt: value.excerpt };
}
