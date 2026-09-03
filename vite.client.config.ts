import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    cssCodeSplit: false,
    emptyOutDir: true,
    lib: {
      cssFileName: 'styles',
      entry: 'src/client.ts',
      fileName: 'client',
      formats: ['es'],
    },
    outDir: 'client-dist',
  },
});
