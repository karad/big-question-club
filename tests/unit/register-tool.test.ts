import { describe, expect, it, vi } from 'vitest';

import {
  SAFETY_VERIFICATION_CASES,
  createQuestionError,
  getSafetyVerificationQuestion,
} from '../../src/domain/verification-question';
import {
  SAFETY_VERIFICATION_TOOL_NAME,
  executeVerificationQuestionTool,
  registerVerificationQuestionTool,
} from '../../src/webmcp/register-tool';

describe('agent safety verification WebMCP tool', () => {
  it('registers a read-only tool whose output is untrusted', async () => {
    const registerTool = vi.fn();

    await expect(
      registerVerificationQuestionTool({ modelContext: { registerTool } }, vi.fn()),
    ).resolves.toEqual({ registered: true });

    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: SAFETY_VERIFICATION_TOOL_NAME,
        inputSchema: {
          type: 'object',
          required: ['caseId'],
          additionalProperties: false,
          properties: { caseId: { type: 'string', minLength: 1 } },
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        description: expect.stringContaining('same language'),
      }),
    );
  });

  it('states privacy and untrusted-content rules in the tool description', async () => {
    const registerTool = vi.fn();

    await registerVerificationQuestionTool({ modelContext: { registerTool } }, vi.fn());

    const [tool] = registerTool.mock.calls[0] as [WebMcpToolDefinition];
    expect(tool.description).toContain('private context');
    expect(tool.description).toContain('untrusted');
  });

  it('returns the selected question when execution options are omitted', async () => {
    const registerTool = vi.fn();
    const question = getSafetyVerificationQuestion('case-ja-01');
    const fetchLike = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(question), { status: 200 }));

    await registerVerificationQuestionTool({ modelContext: { registerTool } }, fetchLike);

    const [tool] = registerTool.mock.calls[0] as [WebMcpToolDefinition];
    await expect(tool.execute({ caseId: 'case-ja-01' })).resolves.toEqual({
      kind: 'question',
      ...question,
    });
    expect(fetchLike).toHaveBeenCalledWith(
      '/api/agent-safety-verification-questions/case-ja-01',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('does not register when WebMCP is unavailable', async () => {
    await expect(registerVerificationQuestionTool({}, vi.fn())).resolves.toMatchObject({
      registered: false,
      code: 'WEBMCP_UNAVAILABLE',
    });
  });

  it('rejects invalid input before calling the API', async () => {
    const fetchLike = vi.fn();

    await expect(executeVerificationQuestionTool({}, undefined, fetchLike)).resolves.toEqual(
      createQuestionError('INVALID_ARGUMENT'),
    );
    expect(fetchLike).not.toHaveBeenCalled();
  });

  it('returns safe errors for unknown, unavailable, and cancelled requests', async () => {
    await expect(
      executeVerificationQuestionTool(
        { caseId: 'unknown-case' },
        undefined,
        vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
      ),
    ).resolves.toEqual(createQuestionError('VERIFICATION_CASE_NOT_FOUND'));

    await expect(
      executeVerificationQuestionTool(
        { caseId: 'case-ja-01' },
        undefined,
        vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
      ),
    ).resolves.toEqual(createQuestionError('VERIFICATION_CASE_UNAVAILABLE'));

    const controller = new AbortController();
    controller.abort();
    await expect(
      executeVerificationQuestionTool({ caseId: 'case-ja-01' }, controller.signal, vi.fn()),
    ).resolves.toEqual(createQuestionError('REQUEST_CANCELLED'));
  });

  it('defines fixed cases without sensitive fields', () => {
    for (const question of SAFETY_VERIFICATION_CASES) {
      expect(Object.keys(question).sort()).toEqual([
        'category',
        'expectedBehavior',
        'id',
        'language',
        'question',
      ]);
    }
  });
});
