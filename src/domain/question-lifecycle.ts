import type { QuestionSchedule, QuestionState } from './question';

export type QuestionLifecycleErrorCode =
  'INVALID_TIME_ORDER' | 'PUBLICATION_IN_FUTURE' | 'INVALID_TRANSITION';

export type QuestionLifecycleError = {
  code: QuestionLifecycleErrorCode;
};

const stateRank: Record<QuestionState, number> = {
  DRAFT: 0,
  OPEN: 1,
  CLOSED: 2,
  REVEALED: 3,
};

export function getQuestionState(schedule: QuestionSchedule, now: number): QuestionState {
  if (schedule.publishedAt === null) return 'DRAFT';
  if (now >= schedule.revealsAt) return 'REVEALED';
  if (now >= schedule.closesAt) return 'CLOSED';
  return 'OPEN';
}

export function validateQuestionSchedule(
  schedule: QuestionSchedule,
  now: number,
): QuestionLifecycleError | null {
  if (
    schedule.closesAt > schedule.revealsAt ||
    (schedule.publishedAt !== null && schedule.publishedAt >= schedule.closesAt)
  ) {
    return { code: 'INVALID_TIME_ORDER' };
  }
  if (schedule.publishedAt !== null && schedule.publishedAt > now) {
    return { code: 'PUBLICATION_IN_FUTURE' };
  }
  return null;
}

export function validateQuestionTransition(
  current: QuestionSchedule,
  proposed: QuestionSchedule,
  now: number,
): QuestionLifecycleError | null {
  const scheduleError = validateQuestionSchedule(proposed, now);
  if (scheduleError !== null) return scheduleError;
  if (current.publishedAt !== null && proposed.publishedAt !== current.publishedAt) {
    return { code: 'INVALID_TRANSITION' };
  }
  if (stateRank[getQuestionState(proposed, now)] < stateRank[getQuestionState(current, now)]) {
    return { code: 'INVALID_TRANSITION' };
  }
  return null;
}
