import { answerError, parseSubmissionInput, type AnswerError } from '../domain/answer-submission';
import { getWebMcpSupport } from './browser-support';
import { registrationFailure } from './register-get-question-tool';

export const UPDATE_ANSWER_TOOL_NAME = 'update_answer';
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function parseInput(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    return answerError('INVALID_INPUT');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).length !== 3 || typeof value.questionId !== 'string' || !value.questionId)
    return answerError('INVALID_INPUT');
  const submission = parseSubmissionInput({ answer: value.answer, excerpt: value.excerpt });
  return 'code' in submission ? submission : { questionId: value.questionId, ...submission };
}

export async function executeUpdateAnswerTool(
  input: unknown,
  signal: AbortSignal | undefined,
  fetchLike: FetchLike,
  endpoint = '/api/questions',
): Promise<unknown | AnswerError> {
  const parsed = parseInput(input);
  if ('code' in parsed) return parsed;
  if (signal?.aborted) return answerError('TOOL_UNAVAILABLE');
  try {
    const response = await fetchLike(
      `${endpoint}/${encodeURIComponent(parsed.questionId)}/my-answer`,
      {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: parsed.answer, excerpt: parsed.excerpt }),
        ...(signal === undefined ? {} : { signal }),
      },
    );
    return await response.json();
  } catch {
    return answerError('TOOL_UNAVAILABLE');
  }
}

export async function registerUpdateAnswerTool(
  documentLike: Pick<Document, 'modelContext'>,
  fetchLike: FetchLike,
): Promise<{ registered: true } | { registered: false; message: string }> {
  const support = getWebMcpSupport(documentLike);
  if (!support.available) return { registered: false, message: support.message };
  try {
    await support.modelContext.registerTool({
      name: UPDATE_ANSWER_TOOL_NAME,
      description:
        "Only when the human explicitly asks, replace the current user's answer before its deadline.",
      inputSchema: {
        type: 'object',
        required: ['questionId', 'answer', 'excerpt'],
        additionalProperties: false,
        properties: {
          questionId: { type: 'string', minLength: 1 },
          answer: {
            type: 'string',
            minLength: 1,
            description: 'Public answer, limited to 5,000 user-perceived characters.',
          },
          excerpt: {
            type: 'string',
            minLength: 1,
            description: 'Single-line excerpt, limited to 160 user-perceived characters.',
          },
        },
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input, options) => executeUpdateAnswerTool(input, options?.signal, fetchLike),
    });
    return { registered: true };
  } catch {
    return registrationFailure();
  }
}
