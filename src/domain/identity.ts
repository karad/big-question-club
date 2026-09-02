export type IdentitySuccess = { userId: string };

export type IdentityErrorCode =
  'AUTHENTICATION_REQUIRED' | 'IDENTITY_UNAVAILABLE' | 'INVALID_ARGUMENT';

export type IdentityError = { code: IdentityErrorCode; message: string };

export type IdentityResult = IdentitySuccess | IdentityError;

const messages: Record<IdentityErrorCode, string> = {
  AUTHENTICATION_REQUIRED: 'Sign in to identify your account.',
  IDENTITY_UNAVAILABLE: 'Identity verification is temporarily unavailable.',
  INVALID_ARGUMENT: 'This tool does not accept input.',
};

export function createIdentity(userId: string): IdentitySuccess {
  return { userId };
}

export function createIdentityError(code: IdentityErrorCode): IdentityError {
  return { code, message: messages[code] };
}

export function validateIdentityInput(input: unknown): IdentityError | null {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input) ||
    Object.keys(input).length > 0
  ) {
    return createIdentityError('INVALID_ARGUMENT');
  }

  return null;
}

export function parseIdentity(payload: unknown): IdentityResult {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return createIdentityError('IDENTITY_UNAVAILABLE');
  }

  const record = payload as Record<string, unknown>;
  const userId = record.userId;

  if (typeof userId !== 'string' || userId.length === 0 || Object.keys(record).length !== 1) {
    return createIdentityError('IDENTITY_UNAVAILABLE');
  }

  return createIdentity(userId);
}
