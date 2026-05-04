import { test, expect } from '@playwright/test'
import { loginAs, uniqueEmail } from './fixtures'

test.describe('Authentication', () => {
  test('registers with a valid email and lands on /hotels', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('email-input').fill(uniqueEmail())
    await page.getByTestId('btn-continue').click()
    await expect(page).toHaveURL('/hotels')
  })

  test('same email returns the same user (idempotent)', async ({ page }) => {
    const email = uniqueEmail()
    const r1 = await page.request.post('/api/users', { data: { email } })
    const r2 = await page.request.post('/api/users', { data: { email } })
    expect((await r1.json()).id).toBe((await r2.json()).id)
  })

  test('shows error for invalid email format', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('email-input').fill('notanemail')
    await page.getByTestId('btn-continue').click()
    // API rejects; user stays on login page with error shown
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('auth-error')).toBeVisible()
  })

  test('already-logged-in user is redirected from / to /hotels', async ({ page }) => {
    await loginAs(page)
    await page.goto('/')
    await expect(page).toHaveURL('/hotels')
  })

  test('unauthenticated user visiting /hotels is redirected to /', async ({ page }) => {
    await page.goto('/hotels')
    await expect(page).toHaveURL('/')
  })

  test('unauthenticated user visiting /my-bookings is redirected to /', async ({ page }) => {
    await page.goto('/my-bookings')
    await expect(page).toHaveURL('/')
  })

  test('unauthenticated user visiting /book is redirected to /', async ({ page }) => {
    await page.goto('/book?roomId=r1&checkIn=2028-03-01&checkOut=2028-03-03')
    await expect(page).toHaveURL('/')
  })

  test('sign out clears session and redirects to /', async ({ page }) => {
    await loginAs(page)
    await page.goto('/hotels')
    await page.getByTestId('btn-sign-out').click()
    await expect(page).toHaveURL('/')
    // Confirm localStorage is cleared
    const stored = await page.evaluate(() => localStorage.getItem('hb_user'))
    expect(stored).toBeNull()
  })
})
