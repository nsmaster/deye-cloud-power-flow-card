/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  define: {
    __CARD_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    lib: {
      entry: 'src/deye-cloud-power-flow-card.ts',
      formats: ['es'],
      fileName: () => 'deye-cloud-power-flow-card.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2021',
  },
  server: {
    open: '/dev/',
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
