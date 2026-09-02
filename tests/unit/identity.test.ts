import { describe, expect, it } from 'vitest';

import {
  createIdentity,
  createIdentityError,
  parseIdentity,
  validateIdentityInput,
} from '../../src/domain/identity';

describe('identity contract', () => {
  it('exposes only a stable user identifier', () => {
    expect(createIdentity('user-123')).toEqual({ userId: 'user-123' });
  });

  it('rejects unexpected tool input', () => {
    expect(validateIdentityInput({ unexpected: true })).toEqual(
      createIdentityError('INVALID_ARGUMENT'),
    );
  });

  it.each([{}, { userId: '' }, { userId: 'user-123', email: 'private@example.com' }, null])(
    'does not accept unsafe identity payloads: %#',
    (payload) => {
      expect(parseIdentity(payload)).toEqual(createIdentityError('IDENTITY_UNAVAILABLE'));
    },
  );
});
