import { describe, expect, it, vi } from 'vitest';
import {
  executeMySubmissionTool,
  GET_MY_SUBMISSION_TOOL_NAME,
  registerMySubmissionTool,
} from '../../src/webmcp/register-my-submission-tool';
describe('get_my_submission WebMCP tool', () => {
  it('registers as read-only and fetches only the caller submission', async () => {
    const registerTool = vi.fn();
    await registerMySubmissionTool({ modelContext: { registerTool } }, vi.fn());
    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: GET_MY_SUBMISSION_TOOL_NAME,
        annotations: { readOnlyHint: true, untrustedContentHint: true },
      }),
    );
    const registration = registerTool.mock.calls[0]?.[0] as { description?: string };
    expect(registration.description).toContain('after a submission attempt to verify');
  });
  it('rejects invalid input', async () => {
    await expect(executeMySubmissionTool({}, undefined, vi.fn())).resolves.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });
  it('requests only the caller-specific endpoint and never accepts another answer id', async () => {
    const fetchLike = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ questionId: 'q', status: 'not_submitted' })),
      );
    await expect(
      executeMySubmissionTool({ questionId: 'q' }, undefined, fetchLike),
    ).resolves.toEqual({ questionId: 'q', status: 'not_submitted' });
    expect(fetchLike).toHaveBeenCalledWith(
      '/api/questions/q/my-submission',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
    await expect(
      executeMySubmissionTool({ questionId: 'q', answerId: 'someone-else' }, undefined, fetchLike),
    ).resolves.toMatchObject({ code: 'INVALID_INPUT' });
  });
});
