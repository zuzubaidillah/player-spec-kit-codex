import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  base: './',
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    globals: true
  },
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11', 'chrome >= 49', 'safari >= 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    sourcemap: true,
    target: 'es2019'
  }
});
