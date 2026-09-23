import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://humananimalpairs.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
