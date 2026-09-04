/**
 * Prevents guarded forms from being submitted more than once.
 * @param root - Document containing forms to initialize.
 * @returns Nothing.
 */
export function initializeSubmissionGuards(root: Document = document): void {
  root.querySelectorAll<HTMLFormElement>('form[data-submission-guard]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      if (!form.checkValidity() || form.dataset.submitting === 'true') {
        if (form.dataset.submitting === 'true') event.preventDefault();
        return;
      }
      const submitter = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
      const intent = submitter?.value;
      const intentInput = form.querySelector<HTMLInputElement>('input[data-submit-intent]');
      if (intentInput !== null && intent !== undefined) intentInput.value = intent;
      form.dataset.submitting = 'true';
      form.querySelectorAll<HTMLButtonElement>('button[type="submit"]').forEach((button) => {
        button.disabled = true;
      });
      const status = form.querySelector<HTMLElement>('[data-submission-status]');
      if (status !== null) status.textContent = submitter?.dataset.pendingLabel ?? 'Working…';
    });
  });
}
