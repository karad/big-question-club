import { afterEach, describe, expect, it } from 'vitest';
import { initializeQuestionLists } from '../../src/ui/question-list';

const originalElement = globalThis.HTMLElement;
class FakeElement {
  dataset: Record<string, string> = {};
  attrs = new Map<string, string>();
  closest() {
    return this;
  }
  setAttribute(name: string, value: string) {
    this.attrs.set(name, value);
  }
}
afterEach(() => {
  globalThis.HTMLElement = originalElement;
});

describe('question list controls', () => {
  it('switches every deadline in the same list scope together', () => {
    globalThis.HTMLElement = FakeElement as unknown as typeof HTMLElement;
    let listener: ((event: Event) => void) | undefined;
    const toggle = new FakeElement();
    toggle.dataset.toggleDeadlines = '';
    const remaining = {
      toggleAttribute: (_: string, hidden: boolean) => {
        remaining.hidden = hidden;
      },
      hidden: false,
    };
    const absolute = {
      toggleAttribute: (_: string, hidden: boolean) => {
        absolute.hidden = hidden;
      },
      hidden: true,
    };
    const pair = {
      querySelector: (selector: string) => (selector.includes('remaining') ? remaining : absolute),
    };
    const scope = {
      dataset: {} as Record<string, string>,
      addEventListener: (_: string, callback: (event: Event) => void) => {
        listener = callback;
      },
      querySelectorAll: () => [pair],
    };
    initializeQuestionLists({ querySelectorAll: () => [scope] } as unknown as Document);
    listener?.({ target: toggle } as unknown as Event);
    expect(scope.dataset.deadlineMode).toBe('absolute');
    expect(remaining.hidden).toBe(true);
    expect(absolute.hidden).toBe(false);
  });
});
