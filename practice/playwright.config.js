import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import baseline from '../playwright.config.js';
export default defineConfig({
  testDir: './tests/browser', workers: 1, reporter: 'list',
  use: { ...baseline.use, baseURL: 'http://127.0.0.1:3201' },
  webServer: { command: 'node scripts/practice.mjs start', cwd: fileURLToPath(new URL('../', import.meta.url)), url: 'http://127.0.0.1:3201/api/health', reuseExistingServer: false,
    env: { PRACTICE_PORT: '3201', PRACTICE_AI_MODE: 'mock', GEMINI_API_KEY: '' } }
});
