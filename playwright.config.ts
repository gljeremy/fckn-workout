import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT || 4179);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}/fckn-workout/`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${port} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${port}/fckn-workout/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
