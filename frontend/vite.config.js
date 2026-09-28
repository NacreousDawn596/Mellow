import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, proxy /api to the local FastAPI backend so the frontend can
// always use same-origin relative URLs. Set VITE_API_BASE to override the
// API origin (e.g. a remote backend) if needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.MELLOW_BACKEND || 'http://localhost:17432',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
