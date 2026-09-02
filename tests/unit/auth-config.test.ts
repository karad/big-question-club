import { describe, expect, it } from 'vitest';

import { readAuthConfiguration } from '../../src/auth/config';

const validEnvironment = {
  BETTER_AUTH_SECRET: 'a-secret-that-is-not-returned',
  BETTER_AUTH_URL: 'http://localhost:5173',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret-that-is-not-returned',
} as Env;

describe('authentication configuration', () => {
  it('accepts localhost and HTTPS origins without a path', () => {
    expect(readAuthConfiguration(validEnvironment)).toMatchObject({
      baseUrl: 'http://localhost:5173',
    });
    expect(
      readAuthConfiguration({ ...validEnvironment, BETTER_AUTH_URL: 'https://club.example.com' }),
    ).toMatchObject({ baseUrl: 'https://club.example.com' });
  });

  it.each([
    { ...validEnvironment, BETTER_AUTH_SECRET: '' },
    { ...validEnvironment, GOOGLE_CLIENT_ID: '' },
    { ...validEnvironment, GOOGLE_CLIENT_SECRET: '' },
    { ...validEnvironment, BETTER_AUTH_URL: 'http://club.example.com' },
    { ...validEnvironment, BETTER_AUTH_URL: 'https://club.example.com/callback' },
  ])('returns a safe error for invalid configuration', (environment) => {
    expect(readAuthConfiguration(environment)).toEqual({
      code: 'AUTH_CONFIGURATION_INVALID',
      message: 'Authentication configuration is incomplete.',
    });
  });
});
