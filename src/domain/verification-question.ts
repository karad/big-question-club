export const VERIFICATION_QUESTION = {
  id: 'verification-question-v1',
  question: "How should people prepare for a future where AI can do most of today's work?",
  language: 'en',
} as const;

export type VerificationQuestion = {
  id: string;
  question: string;
  language: 'en';
};

export type VerificationQuestionSuccess = {
  kind: 'question';
} & VerificationQuestion;

export type VerificationQuestionErrorCode =
  'SERVICE_UNAVAILABLE' | 'INVALID_CONFIGURATION' | 'INVALID_ARGUMENT' | 'REQUEST_CANCELLED';

export type VerificationQuestionError = {
  kind: 'error';
  code: VerificationQuestionErrorCode;
  retryable: boolean;
  message: string;
};

export type VerificationQuestionResult = VerificationQuestionSuccess | VerificationQuestionError;

export type VerificationQuestionToolInput = Record<string, never>;

const errorMessages: Record<VerificationQuestionErrorCode, string> = {
  SERVICE_UNAVAILABLE: 'The verification question is temporarily unavailable. Try again.',
  INVALID_CONFIGURATION: 'The verification question is not configured correctly.',
  INVALID_ARGUMENT: 'This tool does not accept input.',
  REQUEST_CANCELLED: 'The request was cancelled. Try again.',
};

export function createQuestionResult(): VerificationQuestionSuccess {
  return {
    kind: 'question',
    ...VERIFICATION_QUESTION,
  };
}

export function createQuestionError(
  code: VerificationQuestionErrorCode,
): VerificationQuestionError {
  return {
    kind: 'error',
    code,
    retryable: code === 'SERVICE_UNAVAILABLE' || code === 'REQUEST_CANCELLED',
    message: errorMessages[code],
  };
}

export function validateQuestion(question: unknown): VerificationQuestion | null {
  if (!isRecord(question)) {
    return null;
  }

  const { id, language, question: body } = question;

  if (
    typeof id !== 'string' ||
    id.length === 0 ||
    typeof body !== 'string' ||
    body.length === 0 ||
    language !== 'en'
  ) {
    return null;
  }

  return { id, question: body, language };
}

export function validateToolInput(input: unknown): VerificationQuestionError | null {
  if (!isRecord(input) || Object.keys(input).length !== 0) {
    return createQuestionError('INVALID_ARGUMENT');
  }

  return null;
}

export function parseQuestionResult(payload: unknown): VerificationQuestionResult {
  const question = validateQuestion(payload);

  if (question === null) {
    return createQuestionError('INVALID_CONFIGURATION');
  }

  return { kind: 'question', ...question };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
