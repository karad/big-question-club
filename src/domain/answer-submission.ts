import { MAX_ANSWER_LENGTH, MAX_EXCERPT_LENGTH } from './question';
import { countGraphemes } from './text';

export type AnswerErrorCode =
  | 'INVALID_INPUT'
  | 'AUTHENTICATION_REQUIRED'
  | 'QUESTION_NOT_FOUND'
  | 'ANSWER_ALREADY_SUBMITTED'
  | 'QUESTION_CLOSED'
  | 'ANSWER_NOT_FOUND'
  | 'TOOL_UNAVAILABLE'
  | 'ANSWER_UNAVAILABLE';
export type AnswerError = { code: AnswerErrorCode; message: string };
export type SubmissionInput = { answer: string; excerpt: string };

const messages: Record<AnswerErrorCode, string> = {
  INVALID_INPUT: 'The request input is invalid.',
  AUTHENTICATION_REQUIRED: 'Sign in to submit an answer.',
  QUESTION_NOT_FOUND: 'The requested question is unavailable.',
  ANSWER_ALREADY_SUBMITTED: 'An answer has already been submitted.',
  ANSWER_NOT_FOUND: 'No answer has been submitted for this question.',
  QUESTION_CLOSED: 'This question is closed.',
  TOOL_UNAVAILABLE: 'The requested operation is temporarily unavailable.',
  ANSWER_UNAVAILABLE: 'The requested answer is unavailable.',
};
export function answerError(code: AnswerErrorCode): AnswerError {
  return { code, message: messages[code] };
}
export function parseSubmissionInput(input: unknown): SubmissionInput | AnswerError {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    return answerError('INVALID_INPUT');
  const value = input as Record<string, unknown>;
  if (
    Object.keys(value).length !== 2 ||
    typeof value.answer !== 'string' ||
    typeof value.excerpt !== 'string'
  )
    return answerError('INVALID_INPUT');
  if (
    !value.answer.trim() ||
    countGraphemes(value.answer) > MAX_ANSWER_LENGTH ||
    !value.excerpt.trim() ||
    countGraphemes(value.excerpt) > MAX_EXCERPT_LENGTH ||
    /[\r\n]/.test(value.excerpt)
  )
    return answerError('INVALID_INPUT');
  return { answer: value.answer, excerpt: value.excerpt };
}
