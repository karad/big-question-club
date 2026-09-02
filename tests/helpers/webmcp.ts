import { expect, vi } from 'vitest';

export function createWebMcpHarness(response: unknown = {}) {
  const registerTool = vi.fn();
  const fetchLike = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  return {
    documentLike: { modelContext: { registerTool } },
    fetchLike,
    registerTool,
  };
}

export function expectNoSensitiveFields(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const field of ['userId', 'cookie', 'token', 'creatorUserId', 'answerCount'])
    expect(serialized).not.toContain(`"${field}"`);
}
