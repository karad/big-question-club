import { afterEach, describe, expect, it } from 'vitest';
import { initializeSubmissionGuards } from '../../src/ui/form-submission-guard';

const originalButton = globalThis.HTMLButtonElement;
class FakeButton {
  value = 'publish';
  disabled = false;
  dataset = { pendingLabel: 'Publishing…' };
}
afterEach(() => {
  globalThis.HTMLButtonElement = originalButton;
});

describe('form submission guard', () => {
  it('preserves the selected intent and disables every submit action once', () => {
    globalThis.HTMLButtonElement = FakeButton as unknown as typeof HTMLButtonElement;
    let listener: ((event: SubmitEvent) => void) | undefined;
    const selected = new FakeButton();
    const other = new FakeButton();
    const intent = { value: '' };
    const status = { textContent: '' };
    const form = {
      dataset: {} as Record<string, string>,
      checkValidity: () => true,
      addEventListener: (_: string, callback: (event: SubmitEvent) => void) => {
        listener = callback;
      },
      querySelector: (selector: string) => (selector.includes('intent') ? intent : status),
      querySelectorAll: () => [selected, other],
    };
    initializeSubmissionGuards({ querySelectorAll: () => [form] } as unknown as Document);
    listener?.({ submitter: selected, preventDefault() {} } as unknown as SubmitEvent);
    expect(intent.value).toBe('publish');
    expect(selected.disabled).toBe(true);
    expect(other.disabled).toBe(true);
    expect(status.textContent).toBe('Publishing…');
  });
});
