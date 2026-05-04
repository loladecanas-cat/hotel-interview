import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/globalSetup.ts',
  fullyParallel: false, // shared in-memory server state
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'pip install -r requirements.txt -q && python -m uvicorn main:app --port 8000',
      url: 'http://localhost:8000/api/hotels',
      cwd: 'backend',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:8080',
      cwd: 'frontend',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})
