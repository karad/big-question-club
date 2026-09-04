type ClipboardLike = Pick<Clipboard, 'writeText'>;

/**
 * Initializes buttons that copy agent prompts to the clipboard.
 * @param root - Document containing prompt-copy controls.
 * @param clipboard - Clipboard implementation used to write prompt text.
 * @returns Nothing.
 */
export function initializeAgentPromptClipboard(
  root: Pick<Document, 'querySelector'> & Partial<Pick<Document, 'querySelectorAll'>>,
  clipboard: ClipboardLike | undefined = navigator.clipboard,
): void {
  const sections = root.querySelectorAll?.<HTMLElement>('[data-agent-request]');
  if (sections !== undefined && sections.length > 0) {
    sections.forEach((section) => initializeSection(section, clipboard));
    return;
  }
  initializeSection(root, clipboard);
}

function initializeSection(
  root: Pick<Document, 'querySelector'> | Pick<HTMLElement, 'querySelector'>,
  clipboard: ClipboardLike | undefined,
): void {
  const prompt = root.querySelector<HTMLTextAreaElement>('[data-agent-request-prompt]');
  const button = root.querySelector<HTMLButtonElement>('[data-copy-agent-prompt]');
  const status = root.querySelector<HTMLElement>('[data-copy-agent-prompt-status]');
  if (prompt === null || button === null || status === null) return;
  button.addEventListener('click', () => {
    if (clipboard === undefined) {
      status.textContent = 'Copy failed. Select the prompt and copy it manually.';
      return;
    }
    void clipboard.writeText(prompt.value).then(
      () => {
        status.textContent = 'Copied';
      },
      () => {
        status.textContent = 'Copy failed. Select the prompt and copy it manually.';
      },
    );
  });
}
