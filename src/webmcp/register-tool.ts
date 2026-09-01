import {
  createQuestionError,
  parseQuestionResult,
  validateToolInput,
  type VerificationQuestionResult,
} from '../domain/verification-question';
import { getWebMcpSupport } from './browser-support';

export const VERIFICATION_TOOL_NAME = 'get_verification_question';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type WebMcpRegistration =
  | { registered: true }
  | {
      registered: false;
      code: 'WEBMCP_UNAVAILABLE' | 'WEBMCP_REGISTRATION_FAILED';
      message: string;
    };

export async function registerVerificationQuestionTool(
  documentLike: Pick<Document, 'modelContext'>,
  fetchLike: FetchLike,
  endpoint = '/api/verification-question',
): Promise<WebMcpRegistration> {
  const support = getWebMcpSupport(documentLike);

  if (!support.available) {
    return {
      registered: false,
      code: support.code,
      message: support.message,
    };
  }

  try {
    await support.modelContext.registerTool({
      name: VERIFICATION_TOOL_NAME,
      description: 'Get the fixed verification question for Big Question Club.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: (input, options) =>
        executeVerificationQuestionTool(input, options?.signal, fetchLike, endpoint),
    });
  } catch {
    return {
      registered: false,
      code: 'WEBMCP_REGISTRATION_FAILED',
      message: 'WebMCP tool registration failed. Check the browser configuration.',
    };
  }

  return { registered: true };
}

export async function executeVerificationQuestionTool(
  input: unknown,
  signal: AbortSignal | undefined,
  fetchLike: FetchLike,
  endpoint = '/api/verification-question',
): Promise<VerificationQuestionResult> {
  const inputError = validateToolInput(input);

  if (inputError !== null) {
    return inputError;
  }

  if (signal?.aborted) {
    return createQuestionError('REQUEST_CANCELLED');
  }

  try {
    const response = await fetchLike(endpoint, {
      ...(signal === undefined ? {} : { signal }),
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return createQuestionError('SERVICE_UNAVAILABLE');
    }

    return parseQuestionResult(await response.json());
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return createQuestionError('REQUEST_CANCELLED');
    }

    return createQuestionError('SERVICE_UNAVAILABLE');
  }
}
