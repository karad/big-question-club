import { registerVerificationQuestionTool } from './webmcp/register-tool';

const statusElement = document.getElementById('webmcp-status');

function updateStatus(message: string): void {
  if (statusElement !== null) {
    statusElement.textContent = message;
  }
}

void registerVerificationQuestionTool(document, fetch).then((registration) => {
  if (registration.registered) {
    updateStatus(
      'WebMCP tool registered. Use your personal agent to retrieve the verification question.',
    );
    return;
  }

  updateStatus(registration.message);
});
