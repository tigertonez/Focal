
import { defineConfig, devices } from '@playwright/test';

// Use process.env.PORT by default and fallback to 3000 if not specified.
const PORT = process.env.PORT || 9002;

// Set web server config for test environments.
const webServer = {
  command: 'npm run dev',
  url: `http://localhost:${PORT}`,
  timeout: 120 * 1000,
  reuseExistingServer: !process.env.CI,
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'], viewport: { width: 375, height: 812 } },
    },
  ],
  webServer,
});
