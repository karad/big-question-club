import { answerError, type AnswerError } from '../domain/answer-submission';

/**
 * Validates and normalizes a question identifier from untrusted tool input.
 * @param input - Tool input to validate.
 * @returns The normalized identifier or a structured validation error.
 */
export function parseQuestionIdInput(input: unknown): { questionId: string } | AnswerError {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input) ||
    Object.keys(input).length !== 1 ||
    typeof (input as { questionId?: unknown }).questionId !== 'string' ||
    !(input as { questionId: string }).questionId
  )
    return answerError('INVALID_INPUT');
  return { questionId: (input as { questionId: string }).questionId };
}
