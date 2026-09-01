export type WebMcpSupport =
  | { available: true; modelContext: ModelContext }
  | { available: false; code: 'WEBMCP_UNAVAILABLE'; message: string };

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
