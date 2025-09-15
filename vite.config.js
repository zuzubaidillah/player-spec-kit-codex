import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js']
  },
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    sourcemap: true
  }
});
