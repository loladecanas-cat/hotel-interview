import { request } from '@playwright/test'

/**
 * Runs once before the entire test suite.
 * Wipes the backend's in-memory store so every `npx playwright test`
 * starts from a clean slate, even when the server is being reused.
 */
export default async function globalSetup() {
  const api = await request.newContext({ baseURL: 'http://localhost:8000' })
  await api.post('/api/reset')
  await api.dispose()
}
