import { Icon } from './icon';

/**
 * Renders the viewer's submission-status badge.
 * @param props - Whether the viewer has answered, or null when the state is unavailable.
 * @returns Submission-status markup.
 */
export function SubmissionStatus({ hasAnswered }: { hasAnswered: boolean | null }) {
  if (hasAnswered !== true) return null;
  return (
    <span class="status-submission" data-submission-status="answered">
      <Icon name="check" />
      Answered
    </span>
  );
}
