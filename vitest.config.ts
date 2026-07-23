import { defineConfig } from 'vitest/config';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env.local') });

export default defineConfig({
  test: {
    environment: 'node',
    env: { TZ: 'UTC' },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
