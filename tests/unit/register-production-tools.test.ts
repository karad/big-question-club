import { describe, expect, it, vi } from 'vitest';
import { registerProductionWebMcpTools } from '../../src/webmcp/register-production-tools';

describe('production WebMCP surface', () => {
  it('registers exactly the five SPEC 007 tools in workflow order', async () => {
    const names: string[] = [];
    await registerProductionWebMcpTools(
      {
        modelContext: {
          registerTool: vi.fn(async ({ name }: { name: string }) => {
            names.push(name);
          }),
        },
      },
      vi.fn(),
    );
    expect(names).toEqual([
      'get_question',
      'submit_answer',
      'update_answer',
      'remove_answer',
      'get_my_submission',
    ]);
    expect(names.join(' ')).not.toMatch(/list|search|summary|compare|other|count|detail/);
  });
});
