import { defineConfig, devices } from '@playwright/test';

// Recording config for PR demo clips. Separate from playwright.config.ts because demos are
// paced for a human viewer (deliberate pauses, one worker, no retries) and always record
// video, whereas the e2e suite is optimised for speed. See docs/pr-demo-video.md.
const DESKTOP = { width: 1280, height: 800 };
const PIXEL = devices['Pixel 7'].viewport;

// Environments with a preinstalled Chromium of a different build (e.g. Claude Code on the web,
// where /opt/pw-browsers/chromium is provided) can point at it instead of downloading one.
const launchOptions = process.env.PLAYWRIGHT_CHROMIUM_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
  : {};

export default defineConfig({
  testDir: './tests/demo',
  testMatch: /.*\.demo\.ts$/,
  outputDir: './demo-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: [['list'], ['json', { outputFile: 'demo-results/report.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'off',
    screenshot: 'off',
    launchOptions,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: DESKTOP,
        video: { mode: 'on', size: DESKTOP },
      },
    },
    {
      name: 'pixel',
      use: {
        ...devices['Pixel 7'],
        video: { mode: 'on', size: PIXEL },
      },
    },
  ],
});
