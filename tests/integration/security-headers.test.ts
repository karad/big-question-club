import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

describe('Security headers', () => {
  it.each(['/health', '/', '/missing'])(
    'prevents framing and restricts executable content on %s',
    async (path) => {
      const response = await createApp().request(`https://example.test${path}`);
      expect(response.headers.get('x-frame-options')).toBe('DENY');
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
      expect(response.headers.get('content-security-policy')).toContain("script-src 'self'");
      expect(response.headers.get('content-security-policy')).toContain("object-src 'none'");
    },
  );
});
