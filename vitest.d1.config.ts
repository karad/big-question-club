import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      main: './src/index.tsx',
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations(
            new URL('./migrations', import.meta.url).pathname,
          ),
        },
        compatibilityDate: '2026-09-01',
        compatibilityFlags: ['nodejs_compat'],
        d1Databases: ['TEST_DB'],
      },
    })),
  ],
  test: {
    include: ['tests/d1/*.test.ts'],
  },
});
