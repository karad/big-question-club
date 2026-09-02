import { describe, expect, it, vi } from 'vitest';
import {
  executeSubmitAnswerTool,
  registerSubmitAnswerTool,
  SUBMIT_ANSWER_TOOL_NAME,
} from '../../src/webmcp/register-submit-answer-tool';

describe('submit_answer WebMCP tool', () => {
  it('registers the required body and excerpt schema', async () => {
    const registerTool = vi.fn();
    await registerSubmitAnswerTool({ modelContext: { registerTool } }, vi.fn());
    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: SUBMIT_ANSWER_TOOL_NAME,
        inputSchema: expect.objectContaining({ required: ['questionId', 'answer', 'excerpt'] }),
        annotations: { readOnlyHint: false, untrustedContentHint: false },
      }),
    );
    const registration = registerTool.mock.calls[0]?.[0] as { description?: string };
    expect(registration.description).toContain('context-grounded public answer');
    expect(registration.description).toContain('no additional preview or approval is required');
    expect(registration.description).toContain(
      'Do not submit when relevant user context is insufficient',
    );
  });
  it('posts valid input and preserves API errors', async () => {
    await expect(
      executeSubmitAnswerTool(
        { questionId: 'q', answer: 'A', excerpt: 'E' },
        undefined,
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              questionId: 'q',
              status: 'submitted',
              submittedAt: '2026-01-01T00:00:00.000Z',
            }),
            { status: 201 },
          ),
        ),
      ),
    ).resolves.toMatchObject({ status: 'submitted' });
    await expect(
      executeSubmitAnswerTool(
        { questionId: 'q', answer: 'A', excerpt: 'E' },
        undefined,
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              code: 'ANSWER_ALREADY_SUBMITTED',
              message: 'An answer has already been submitted.',
            }),
            { status: 409 },
          ),
        ),
      ),
    ).resolves.toMatchObject({ code: 'ANSWER_ALREADY_SUBMITTED' });
  });

  it('does not post after cancellation and converts network failure to an unavailable error', async () => {
    const cancelled = new AbortController();
    cancelled.abort();
    const fetchLike = vi.fn();
    await expect(
      executeSubmitAnswerTool(
        { questionId: 'q', answer: 'A', excerpt: 'E' },
        cancelled.signal,
        fetchLike,
      ),
    ).resolves.toMatchObject({ code: 'TOOL_UNAVAILABLE' });
    expect(fetchLike).not.toHaveBeenCalled();
    await expect(
      executeSubmitAnswerTool(
        { questionId: 'q', answer: 'A', excerpt: 'E' },
        undefined,
        vi.fn().mockRejectedValue(new Error('offline')),
      ),
    ).resolves.toMatchObject({ code: 'TOOL_UNAVAILABLE' });
  });
});
