export type AuthConfiguration = {
  baseUrl: string;
  googleClientId: string;
  googleClientSecret: string;
  secret: string;
};

export type AuthConfigurationError = { code: 'AUTH_CONFIGURATION_INVALID'; message: string };

export function readAuthConfiguration(
  env: Pick<
    Env,
    'BETTER_AUTH_SECRET' | 'BETTER_AUTH_URL' | 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET'
  >,
): AuthConfiguration | AuthConfigurationError {
  const baseUrl = parseBaseUrl(env.BETTER_AUTH_URL);

  if (baseUrl === null || !hasRequiredValues(env)) {
    return {
      code: 'AUTH_CONFIGURATION_INVALID',
      message: 'Authentication configuration is incomplete.',
    };
  }

  return {
    baseUrl,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    secret: env.BETTER_AUTH_SECRET,
  };
}

function hasRequiredValues(
  env: Pick<Env, 'BETTER_AUTH_SECRET' | 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET'>,
): boolean {
  return [env.BETTER_AUTH_SECRET, env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET].every(
    (value) => typeof value === 'string' && value.length > 0,
  );
}

function parseBaseUrl(value: string): string | null {
  try {
    const url = new URL(value);

    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.pathname !== '/') {
      return null;
    }

    if (url.protocol === 'http:' && url.hostname !== 'localhost') {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}
