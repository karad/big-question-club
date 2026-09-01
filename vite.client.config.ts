import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: 'src/client.ts',
      fileName: 'client',
      formats: ['es'],
    },
    outDir: 'client-dist',
  },
});
