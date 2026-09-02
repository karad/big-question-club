type ClipboardLike = Pick<Clipboard, 'writeText'>;

export function initializeAgentPromptClipboard(
  root: Pick<Document, 'querySelector'>,
  clipboard: ClipboardLike | undefined = navigator.clipboard,
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
