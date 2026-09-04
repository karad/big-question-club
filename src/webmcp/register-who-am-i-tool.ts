import {
  createIdentityError,
  parseIdentity,
  validateIdentityInput,
  type IdentityResult,
} from '../domain/identity';
import { getWebMcpSupport } from './browser-support';

/** Public WebMCP name for retrieving the current identity. */
export const WHO_AM_I_TOOL_NAME = 'who_am_i';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * Registers the identity WebMCP tool when browser support is available.
 * @param documentLike - Document-like object that exposes the model context.
 * @param fetchLike - Fetch implementation used by the tool.
 * @param endpoint - Identity endpoint.
 * @returns The registration outcome.
 */
export async function registerWhoAmITool(
  documentLike: Pick<Document, 'modelContext'>,
  fetchLike: FetchLike,
  endpoint = '/api/who-am-i',
): Promise<{ registered: true } | { registered: false; message: string }> {
  const support = getWebMcpSupport(documentLike);

  if (!support.available) {
    return { registered: false, message: support.message };
  }

  try {
    await support.modelContext.registerTool({
      name: WHO_AM_I_TOOL_NAME,
      description: 'Return the current Big Question Club user identifier.',
      inputSchema: { type: 'object', additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (input, options) => executeWhoAmITool(input, options?.signal, fetchLike, endpoint),
    });
    return { registered: true };
  } catch {
    return {
      registered: false,
      message: 'WebMCP tool registration failed. Check the browser configuration.',
    };
  }
}

/**
 * Executes a current-identity lookup against the application endpoint.
 * @param input - Untrusted tool input.
 * @param signal - Abort signal supplied by the WebMCP runtime.
 * @param fetchLike - Fetch implementation used for the request.
 * @param endpoint - Identity endpoint.
 * @returns A validated identity result.
 */
export async function executeWhoAmITool(
  input: unknown,
  signal: AbortSignal | undefined,
  fetchLike: FetchLike,
  endpoint = '/api/who-am-i',
): Promise<IdentityResult> {
  const inputError = validateIdentityInput(input);

  if (inputError !== null) {
    return inputError;
  }

  if (signal?.aborted) {
    return createIdentityError('IDENTITY_UNAVAILABLE');
  }

  try {
    const response = await fetchLike(endpoint, {
      ...(signal === undefined ? {} : { signal }),
      headers: { Accept: 'application/json' },
    });

    if (response.status === 401) {
      return createIdentityError('AUTHENTICATION_REQUIRED');
    }

    if (!response.ok) {
      return createIdentityError('IDENTITY_UNAVAILABLE');
    }

    return parseIdentity(await response.json());
  } catch {
    return createIdentityError('IDENTITY_UNAVAILABLE');
  }
}
