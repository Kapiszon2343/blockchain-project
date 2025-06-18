// Import necessary Playwright and Synpress modules
import { defineConfig, devices } from '@playwright/test'

// Define Playwright configuration
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    // Set base URL for tests
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    browserName: 'chromium',
  },
  projects: [
    {
      name: 'chromium',
      use: {
          browserName: 'chromium',
          channel: 'chromium',
          launchOptions: {
            args: ['--no-sandbox'],
          },
      },
    }
  ],
  timeout: 1000000,
})