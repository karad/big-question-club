import { answerError, parseSubmissionInput, type AnswerError } from '../domain/answer-submission';
import { getWebMcpSupport } from './browser-support';

export const SUBMIT_ANSWER_TOOL_NAME = 'submit_answer';
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type Result = { questionId: string; status: 'submitted'; submittedAt: string } | AnswerError;

function parseInput(
  input: unknown,
): { questionId: string; answer: string; excerpt: string } | AnswerError {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    return answerError('INVALID_ANSWER');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).length !== 3 || typeof value.questionId !== 'string' || !value.questionId)
    return answerError('INVALID_ANSWER');
  const submission = parseSubmissionInput({ answer: value.answer, excerpt: value.excerpt });
  return 'code' in submission ? submission : { questionId: value.questionId, ...submission };
}

export async function executeSubmitAnswerTool(
  input: unknown,
  signal: AbortSignal | undefined,
  fetchLike: FetchLike,
  endpoint = '/api/questions',
): Promise<Result> {
  const parsed = parseInput(input);
  if ('code' in parsed) return parsed;
  if (signal?.aborted) return answerError('ANSWER_SUBMISSION_UNAVAILABLE');
  try {
    const response = await fetchLike(
      `${endpoint}/${encodeURIComponent(parsed.questionId)}/answers`,
      {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: parsed.answer, excerpt: parsed.excerpt }),
        ...(signal === undefined ? {} : { signal }),
      },
    );
    const payload = await response.json();
    return response.ok ? (payload as Result) : (payload as AnswerError);
  } catch {
    return answerError('ANSWER_SUBMISSION_UNAVAILABLE');
  }
}

export async function registerSubmitAnswerTool(
  documentLike: Pick<Document, 'modelContext'>,
  fetchLike: FetchLike,
): Promise<{ registered: true } | { registered: false; message: string }> {
  const support = getWebMcpSupport(documentLike);
  if (!support.available) return { registered: false, message: support.message };
  try {
    await support.modelContext.registerTool({
      name: SUBMIT_ANSWER_TOOL_NAME,
      description: 'Submit one public answer and a one-line excerpt for an open question.',
      inputSchema: {
        type: 'object',
        required: ['questionId', 'answer', 'excerpt'],
        additionalProperties: false,
        properties: {
          questionId: { type: 'string', minLength: 1 },
          answer: { type: 'string', minLength: 1, maxLength: 5000 },
          excerpt: { type: 'string', minLength: 1, maxLength: 160 },
        },
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input, options) => executeSubmitAnswerTool(input, options?.signal, fetchLike),
    });
    return { registered: true };
  } catch {
    return {
      registered: false,
      message: 'WebMCP tool registration failed. Check the browser configuration.',
    };
  }
}
