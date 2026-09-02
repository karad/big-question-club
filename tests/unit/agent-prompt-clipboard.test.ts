import { describe, expect, it, vi } from 'vitest';
import { initializeAgentPromptClipboard } from '../../src/ui/agent-prompt-clipboard';

function fixture(writeText?: ReturnType<typeof vi.fn>) {
  let listener: (() => void) | undefined;
  const prompt = { value: 'exact prompt' };
  const button = {
    addEventListener: (_event: string, callback: () => void) => (listener = callback),
  };
  const status = { textContent: '' };
  const root = {
    querySelector(selector: string) {
      if (selector === '[data-agent-request-prompt]') return prompt;
      if (selector === '[data-copy-agent-prompt]') return button;
      if (selector === '[data-copy-agent-prompt-status]') return status;
      return null;
    },
  } as unknown as Pick<Document, 'querySelector'>;
  initializeAgentPromptClipboard(
    root,
    writeText === undefined ? undefined : ({ writeText } as unknown as Clipboard),
  );
  return { click: () => listener?.(), status };
}

describe('Agent prompt clipboard', () => {
  it('copies exactly the displayed prompt and reports success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const { click, status } = fixture(writeText);
    click();
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledWith('exact prompt');
    expect(status.textContent).toBe('Copied');
  });

  it('retains manual-copy fallback when Clipboard is unavailable', () => {
    const { click, status } = fixture();
    click();
    expect(status.textContent).toBe('Copy failed. Select the prompt and copy it manually.');
  });

  it('reports a rejected Clipboard write without changing the prompt', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const { click, status } = fixture(writeText);
    click();
    await Promise.resolve();
    await Promise.resolve();
    expect(status.textContent).toBe('Copy failed. Select the prompt and copy it manually.');
  });
});
