import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Generate manifest for better caching
    manifest: true,
    // Ensure service worker is not processed by Vite
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  // Ensure service worker is served correctly
  publicDir: 'public',
});
