import { Icon } from './icon';

export function SubmissionStatus({ hasAnswered }: { hasAnswered: boolean | null }) {
  if (hasAnswered !== true) return null;
  return (
    <span class="status-submission" data-submission-status="answered">
      <Icon name="check" />
      Answered
    </span>
  );
}
