import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the app under /unipay-dashboard/. HashRouter handles
// client-side routing, so we only need `base` to set the prefix on the bundled
// asset URLs (CSS / JS chunks). Dev keeps `/` so http://localhost:5173 works.
const GITHUB_PAGES_BASE = '/unipay-dashboard/';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? GITHUB_PAGES_BASE : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
}));
