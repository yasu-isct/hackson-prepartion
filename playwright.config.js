import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const systemBrowser = [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(path => path && existsSync(path));
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3100', headless: true, trace: 'retain-on-failure', launchOptions: systemBrowser ? { executablePath: systemBrowser } : {} },
  webServer: { command: 'node server/index.js', url: 'http://127.0.0.1:3100/api/health', reuseExistingServer: false, env: { PORT: '3100', HOST: '127.0.0.1', GEMINI_MODE: 'mock', GEMINI_API_KEY: '' } }
});
