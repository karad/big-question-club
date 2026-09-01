import { answerError, type AnswerError } from '../domain/answer-submission';
import { getWebMcpSupport } from './browser-support';

export const GET_MY_SUBMISSION_TOOL_NAME = 'get_my_submission';
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export async function executeMySubmissionTool(
  input: unknown,
  signal: AbortSignal | undefined,
  fetchLike: FetchLike,
  endpoint = '/api/questions',
): Promise<unknown | AnswerError> {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input) ||
    Object.keys(input).length !== 1 ||
    typeof (input as { questionId?: unknown }).questionId !== 'string' ||
    !(input as { questionId: string }).questionId
  )
    return answerError('INVALID_ANSWER');
  try {
    const response = await fetchLike(
      `${endpoint}/${encodeURIComponent((input as { questionId: string }).questionId)}/my-submission`,
      { headers: { Accept: 'application/json' }, ...(signal === undefined ? {} : { signal }) },
    );
    return await response.json();
  } catch {
    return answerError('ANSWER_SUBMISSION_UNAVAILABLE');
  }
}
export async function registerMySubmissionTool(
  documentLike: Pick<Document, 'modelContext'>,
  fetchLike: FetchLike,
): Promise<{ registered: true } | { registered: false; message: string }> {
  const support = getWebMcpSupport(documentLike);
  if (!support.available) return { registered: false, message: support.message };
  try {
    await support.modelContext.registerTool({
      name: GET_MY_SUBMISSION_TOOL_NAME,
      description: "Return only the current user's submission status for one question.",
      inputSchema: {
        type: 'object',
        required: ['questionId'],
        additionalProperties: false,
        properties: { questionId: { type: 'string', minLength: 1 } },
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (input, options) => executeMySubmissionTool(input, options?.signal, fetchLike),
    });
    return { registered: true };
  } catch {
    return {
      registered: false,
      message: 'WebMCP tool registration failed. Check the browser configuration.',
    };
  }
}
