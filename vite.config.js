import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/hitster-timeline/' : '/',
  server: {
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
  },
});
