import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/d1/*.test.ts'],
    environment: 'node',
    coverage: {
      enabled: false,
    },
  },
});
