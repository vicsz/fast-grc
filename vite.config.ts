import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// The React app lives in web/ and builds into dist/web, which NestJS serves.
// In development, Vite proxies API calls to NestJS on port 3000.
const api = 'http://localhost:3000';

export default defineConfig({
  root: 'web',
  plugins: [react()],
  build: { outDir: '../dist/web', emptyOutDir: true },
  server: { proxy: { '/api': api, '/health': api, '/version': api } },
});
