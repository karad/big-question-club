import { describe, expect, it, vi } from 'vitest';

import { createQuestionError, createQuestionResult } from '../../src/domain/verification-question';
import {
  VERIFICATION_TOOL_NAME,
  executeVerificationQuestionTool,
  registerVerificationQuestionTool,
} from '../../src/webmcp/register-tool';

describe('verification question WebMCP tool', () => {
  it('registers one read-only tool with an empty input schema', async () => {
    const registerTool = vi.fn();

    await expect(
      registerVerificationQuestionTool({ modelContext: { registerTool } }, vi.fn()),
    ).resolves.toEqual({ registered: true });

    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: VERIFICATION_TOOL_NAME,
        inputSchema: { type: 'object', additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
      }),
    );
  });

  it('returns the question when DevTools omits execution options', async () => {
    const registerTool = vi.fn();
    const fetchLike = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(createQuestionResult()), { status: 200 }));

    await registerVerificationQuestionTool({ modelContext: { registerTool } }, fetchLike);

    const [tool] = registerTool.mock.calls[0] as [WebMcpToolDefinition];

    await expect(tool.execute({})).resolves.toEqual(createQuestionResult());
  });

  it('does not register when WebMCP is unavailable', async () => {
    await expect(registerVerificationQuestionTool({}, vi.fn())).resolves.toMatchObject({
      registered: false,
      code: 'WEBMCP_UNAVAILABLE',
    });
  });

  it('returns the fixed question from a successful API response', async () => {
    const fetchLike = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(createQuestionResult()), { status: 200 }));

    await expect(executeVerificationQuestionTool({}, undefined, fetchLike)).resolves.toEqual(
      createQuestionResult(),
    );
  });

  it('rejects input before calling the API', async () => {
    const fetchLike = vi.fn();

    await expect(
      executeVerificationQuestionTool({ unexpected: true }, undefined, fetchLike),
    ).resolves.toEqual(createQuestionError('INVALID_ARGUMENT'));
    expect(fetchLike).not.toHaveBeenCalled();
  });

  it('returns an unavailable error for a non-successful API response', async () => {
    const fetchLike = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));

    await expect(executeVerificationQuestionTool({}, undefined, fetchLike)).resolves.toEqual(
      createQuestionError('SERVICE_UNAVAILABLE'),
    );
  });

  it('returns a cancellation error when the request was aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(executeVerificationQuestionTool({}, controller.signal, vi.fn())).resolves.toEqual(
      createQuestionError('REQUEST_CANCELLED'),
    );
  });
});
