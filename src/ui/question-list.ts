/**
 * Initializes client-side controls for question lists.
 * @param root - Document containing question-list controls.
 * @returns Nothing.
 */
export function initializeQuestionLists(root: Document = document): void {
  root.querySelectorAll<HTMLElement>('[data-question-list-scope]').forEach((scope) => {
    scope.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const deadlineToggle = target.closest<HTMLElement>('[data-toggle-deadlines]');
      if (deadlineToggle !== null) {
        const absolute = scope.dataset.deadlineMode !== 'absolute';
        scope.dataset.deadlineMode = absolute ? 'absolute' : 'remaining';
        scope.querySelectorAll<HTMLElement>('[data-deadline-pair]').forEach((pair) => {
          pair
            .querySelector<HTMLElement>('[data-time-remaining]')
            ?.toggleAttribute('hidden', absolute);
          pair
            .querySelector<HTMLElement>('[data-time-absolute]')
            ?.toggleAttribute('hidden', !absolute);
        });
        deadlineToggle.setAttribute('aria-pressed', String(absolute));
        return;
      }
      const promptToggle = target.closest<HTMLElement>('[data-toggle-agent-prompt]');
      if (promptToggle !== null) {
        const id = promptToggle.dataset.toggleAgentPrompt;
        const panel = id === undefined ? null : root.getElementById(id);
        if (panel !== null) {
          const open = panel.hasAttribute('hidden');
          panel.toggleAttribute('hidden', !open);
          promptToggle.setAttribute('aria-expanded', String(open));
        }
      }
    });
  });
}
