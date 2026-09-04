/**
 * Initializes progressive loading of full bodies for revealed answers.
 * @param root - Document containing revealed-answer controls.
 * @param request - Fetch-compatible request function.
 * @returns Nothing.
 */
export function initializeRevealedAnswers(
  root: Document = document,
  request: typeof fetch = fetch,
): void {
  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest<HTMLButtonElement>('[data-answer-id]');
    if (button === null) return;
    const answerId = button.dataset.answerId;
    const questionId = button.dataset.questionId;
    const panel = answerId === undefined ? null : root.getElementById(`answer-${answerId}`);
    if (answerId === undefined || questionId === undefined || panel === null) return;
    if (panel.dataset.loaded === 'true') {
      const opening = panel.hasAttribute('hidden');
      panel.toggleAttribute('hidden', !opening);
      button.setAttribute('aria-expanded', String(opening));
      return;
    }
    panel.hidden = false;
    panel.textContent = 'Loading answer…';
    button.disabled = true;
    void request(
      `/api/questions/${encodeURIComponent(questionId)}/answers/${encodeURIComponent(answerId)}`,
      { headers: { Accept: 'application/json' } },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error('request failed');
        const payload = (await response.json()) as { body?: unknown };
        if (typeof payload.body !== 'string') throw new Error('invalid response');
        panel.textContent = payload.body;
        panel.dataset.loaded = 'true';
        button.setAttribute('aria-expanded', 'true');
      })
      .catch(() => {
        panel.textContent = 'Answer could not be loaded. Select this answer to try again.';
      })
      .finally(() => {
        button.disabled = false;
      });
  });
}
