import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Admin portal Vite config — runs on http://localhost:5173
 * Uses index-admin.html as entry point (auto-redirects / → /admin/login).
 *
 * Run with:  npm run dev:admin
 * Or via:   npm run dev  (concurrently starts all three servers)
 */
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
  cacheDir: 'node_modules/.vite-admin',
  // Use the admin-specific HTML entry point
  root: '.',
  build: {
    rollupOptions: {
      input: 'index-admin.html',
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Serve index-admin.html for all routes (SPA)
    middlewareMode: false,
  },
  // Tell Vite to use index-admin.html instead of index.html
  appType: 'spa',
});
