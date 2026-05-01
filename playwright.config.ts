import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3020';
const shouldUseLocalWebServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7']
      }
    }
  ],
  webServer: shouldUseLocalWebServer
    ? {
        command: 'npm run start -- -p 3020',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        url: baseURL
      }
    : undefined
});
