import { describe, expect, it, vi } from 'vitest';

import { getWebMcpSupport } from '../../src/webmcp/browser-support';

describe('getWebMcpSupport', () => {
  it('reports unavailable when Model Context is missing', () => {
    expect(getWebMcpSupport({})).toEqual({
      available: false,
      code: 'WEBMCP_UNAVAILABLE',
      message: 'WebMCP is unavailable. Use a supported Chrome configuration.',
    });
  });

  it('reports unavailable when registerTool is not a function', () => {
    expect(
      getWebMcpSupport({ modelContext: { registerTool: undefined } } as unknown as Document),
    ).toMatchObject({ available: false, code: 'WEBMCP_UNAVAILABLE' });
  });

  it('returns the Model Context when tool registration is available', () => {
    const modelContext: ModelContext = { registerTool: vi.fn() };

    expect(getWebMcpSupport({ modelContext })).toEqual({ available: true, modelContext });
  });
});
