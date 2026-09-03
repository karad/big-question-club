import { getInitialLocalDeadline, toDateTimeLocal } from '../domain/question-deadline';

export function initializeQuestionDeadline(root: Document = document): void {
  const input = root.querySelector<HTMLInputElement>('#question-deadline');
  if (input === null) return;
  const saved = Number(input.dataset.closesAt ?? '');
  if (input.value.length === 0) {
    input.value =
      Number.isSafeInteger(saved) && saved > 0
        ? toDateTimeLocal(new Date(saved))
        : toDateTimeLocal(getInitialLocalDeadline());
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
