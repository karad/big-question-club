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

/**
 * Creates a successful identity result.
 * @param userId - Authenticated user's identifier.
 * @returns A successful identity payload.
 */
export function createIdentity(userId: string): IdentitySuccess {
  return { userId };
}

/**
 * Creates a stable identity error for an error code.
 * @param code - Machine-readable identity error code.
 * @returns The code and its user-facing message.
 */
export function createIdentityError(code: IdentityErrorCode): IdentityError {
  return { code, message: messages[code] };
}

/**
 * Validates input for an identity lookup.
 * @param input - Untrusted tool input.
 * @returns An identity error when invalid, otherwise null.
 */
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

/**
 * Parses an untrusted identity endpoint response.
 * @param payload - Response payload to validate.
 * @returns A validated identity result or an invalid-response error.
 */
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
