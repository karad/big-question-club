export type WebMcpSupport =
  | { available: true; modelContext: ModelContext }
  | { available: false; code: 'WEBMCP_UNAVAILABLE'; message: string };

/**
 * Detects whether the document exposes the WebMCP model context.
 * @param documentLike - Document-like object to inspect.
 * @returns The model context or a structured unavailability result.
 */
export function getWebMcpSupport(documentLike: Pick<Document, 'modelContext'>): WebMcpSupport {
  if (typeof documentLike.modelContext?.registerTool !== 'function') {
    return {
      available: false,
      code: 'WEBMCP_UNAVAILABLE',
      message: 'WebMCP is unavailable. Use a supported Chrome configuration.',
    };
  }

  return { available: true, modelContext: documentLike.modelContext };
}
