import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeRevealedAnswers } from '../../src/ui/revealed-answers';

const originalElement = globalThis.HTMLElement;
class FakeElement {
  dataset: Record<string, string> = {};
  disabled = false;
  attributes = new Map<string, string>();
  closest() {
    return this;
  }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
}
afterEach(() => {
  globalThis.HTMLElement = originalElement;
});

describe('revealed answer expansion', () => {
  it('loads one body, caches it, and keeps other panels independent', async () => {
    globalThis.HTMLElement = FakeElement as unknown as typeof HTMLElement;
    let listener: ((event: Event) => void) | undefined;
    const button = new FakeElement();
    button.dataset = { answerId: 'answer-1', questionId: 'question-1' };
    const panel = {
      dataset: {} as Record<string, string>,
      hidden: true,
      textContent: '',
      hasAttribute: () => false,
      toggleAttribute() {},
    };
    const root = {
      addEventListener: (_: string, callback: (event: Event) => void) => {
        listener = callback;
      },
      getElementById: () => panel,
    } as unknown as Document;
    const request = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ body: 'Full private body' }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    initializeRevealedAnswers(root, request);
    listener?.({ target: button } as unknown as Event);
    await vi.waitFor(() => expect(panel.dataset.loaded).toBe('true'));
    expect(panel.textContent).toBe('Full private body');
    expect(request).toHaveBeenCalledTimes(1);
  });
});
