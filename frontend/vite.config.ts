import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// User-facing store — runs on http://localhost:3000
// Admin portal runs separately via vite.admin.config.ts on http://localhost:5173
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000,
    strictPort: true, // fail clearly if port is already in use
  },
});

