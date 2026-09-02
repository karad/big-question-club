import { describe, expect, it, vi } from 'vitest';
import {
  executeGetQuestionTool,
  registerGetQuestionTool,
} from '../../src/webmcp/register-get-question-tool';
import {
  executeRemoveAnswerTool,
  registerRemoveAnswerTool,
} from '../../src/webmcp/register-remove-answer-tool';
import {
  executeUpdateAnswerTool,
  registerUpdateAnswerTool,
} from '../../src/webmcp/register-update-answer-tool';

describe('SPEC 007 WebMCP tools', () => {
  it.each([
    [registerGetQuestionTool, 'get_question', true, true],
    [registerUpdateAnswerTool, 'update_answer', false, false],
    [registerRemoveAnswerTool, 'remove_answer', false, false],
  ] as const)(
    'registers %s with the required annotations',
    async (register, name, readOnly, untrusted) => {
      const registerTool = vi.fn();
      await register({ modelContext: { registerTool } }, vi.fn());
      expect(registerTool).toHaveBeenCalledWith(
        expect.objectContaining({
          name,
          annotations: { readOnlyHint: readOnly, untrustedContentHint: untrusted },
        }),
      );
    },
  );

  it('uses only encoded caller-specific relative endpoints', async () => {
    const fetchLike = vi.fn().mockResolvedValue(new Response('{}'));
    await executeGetQuestionTool({ questionId: 'q/1' }, undefined, fetchLike);
    await executeUpdateAnswerTool(
      { questionId: 'q/1', answer: 'A', excerpt: 'E' },
      undefined,
      fetchLike,
    );
    await executeRemoveAnswerTool({ questionId: 'q/1' }, undefined, fetchLike);
    expect(fetchLike.mock.calls.map(([url]) => url)).toEqual([
      '/api/questions/q%2F1',
      '/api/questions/q%2F1/my-answer',
      '/api/questions/q%2F1/my-answer',
    ]);
  });

  it('rejects extra identity fields and honors cancellation', async () => {
    const fetchLike = vi.fn();
    await expect(
      executeGetQuestionTool({ questionId: 'q', userId: 'other' }, undefined, fetchLike),
    ).resolves.toMatchObject({ code: 'INVALID_INPUT' });
    const controller = new AbortController();
    controller.abort();
    await expect(
      executeRemoveAnswerTool({ questionId: 'q' }, controller.signal, fetchLike),
    ).resolves.toMatchObject({ code: 'TOOL_UNAVAILABLE' });
    expect(fetchLike).not.toHaveBeenCalled();
  });
});
