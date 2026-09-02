import type { QuestionState } from './question';
import { toIsoTimestamp } from './question';

export type SubmissionPresentation = 'not-submitted' | 'submitted' | 'unavailable';

export type ViewerPresentation =
  | 'anonymous'
  | 'authenticated-unsubmitted'
  | 'authenticated-submitted'
  | 'submission-unavailable'
  | 'closed';

export function formatAnswerCount(count: number): string {
  return count === 1 ? '1 answer' : `${count} answers`;
}

export function getDeadlinePresentation(
  closesAt: number,
  snapshotNow: number,
): { absolute: string; remainingLabel: string; remainingMs: number } {
  const remainingMs = Math.max(0, closesAt - snapshotNow);
  return {
    absolute: toIsoTimestamp(closesAt),
    remainingLabel: formatRemainingTime(remainingMs),
    remainingMs,
  };
}

export function getViewerPresentation({
  authenticated,
  state,
  submission,
}: {
  authenticated: boolean;
  state: QuestionState;
  submission: SubmissionPresentation;
}): ViewerPresentation {
  if (submission === 'unavailable') return 'submission-unavailable';
  if (state !== 'OPEN') return 'closed';
  if (!authenticated) return 'anonymous';
  return submission === 'submitted' ? 'authenticated-submitted' : 'authenticated-unsubmitted';
}

function formatRemainingTime(remainingMs: number): string {
  if (remainingMs === 0) return 'Closed';
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (remainingMs >= day) return pluralize(Math.floor(remainingMs / day), 'day');
  if (remainingMs >= hour) return pluralize(Math.floor(remainingMs / hour), 'hour');
  if (remainingMs >= minute) return pluralize(Math.floor(remainingMs / minute), 'minute');
  return 'Less than 1 minute';
}

function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}
