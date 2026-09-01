import { describe, expect, it, vi } from 'vitest';

import { createIdentityError } from '../../src/domain/identity';
import {
  executeWhoAmITool,
  registerWhoAmITool,
  WHO_AM_I_TOOL_NAME,
} from '../../src/webmcp/register-who-am-i-tool';

describe('who_am_i WebMCP tool', () => {
  it('registers a read-only tool that fetches the same-origin identity endpoint', async () => {
    const registerTool = vi.fn();
    const fetchLike = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ userId: 'user-123' })));

    await expect(
      registerWhoAmITool({ modelContext: { registerTool } }, fetchLike),
    ).resolves.toEqual({
      registered: true,
    });

    const [tool] = registerTool.mock.calls[0] as [WebMcpToolDefinition];
    expect(tool.name).toBe(WHO_AM_I_TOOL_NAME);
    expect(tool.annotations?.readOnlyHint).toBe(true);
    await expect(tool.execute({})).resolves.toEqual({ userId: 'user-123' });
    expect(fetchLike).toHaveBeenCalledWith(
      '/api/who-am-i',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('returns a safe error for unauthorized and unavailable responses', async () => {
    await expect(
      executeWhoAmITool(
        {},
        undefined,
        vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
      ),
    ).resolves.toEqual(createIdentityError('AUTHENTICATION_REQUIRED'));
    await expect(
      executeWhoAmITool(
        {},
        undefined,
        vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
      ),
    ).resolves.toEqual(createIdentityError('IDENTITY_UNAVAILABLE'));
  });
});
