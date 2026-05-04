import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures'

test.describe('Hotel listing', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto('/hotels')
  })

  test('shows exactly 3 hotel cards', async ({ page }) => {
    const cards = page.getByTestId('hotel-card')
    await expect(cards).toHaveCount(3)
  })

  test('each card displays a hotel name', async ({ page }) => {
    const names = page.getByTestId('hotel-name')
    await expect(names).toHaveCount(3)
    await expect(names.nth(0)).toContainText('Bondi')
  })

  test('date inputs are pre-filled with today and tomorrow', async ({ page }) => {
    const today    = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    await expect(page.getByTestId('check-in')).toHaveValue(today)
    await expect(page.getByTestId('check-out')).toHaveValue(tomorrow)
  })

  test('changing check-in auto-advances check-out', async ({ page }) => {
    await page.getByTestId('check-in').fill('2028-06-10')
    await expect(page.getByTestId('check-out')).toHaveValue('2028-06-11')
  })

  test('"View rooms" for hotel 1 navigates to the hotel page', async ({ page }) => {
    await page.getByTestId('btn-view-hotel-1').click()
    await expect(page).toHaveURL(/\/hotels\/1/)
  })

  test('"My bookings" nav link is visible and navigates correctly', async ({ page }) => {
    await page.getByTestId('nav-my-bookings').click()
    await expect(page).toHaveURL('/my-bookings')
  })
})

test.describe('Hotel detail & availability', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('shows all rooms for a hotel', async ({ page }) => {
    await page.goto('/hotels/1?checkIn=2028-07-01&checkOut=2028-07-03')
    await expect(page.getByTestId('room-card')).toHaveCount(3) // hotel 1 has 3 rooms
  })

  test('all rooms show "Book now" when none are booked', async ({ page }) => {
    await page.goto('/hotels/2?checkIn=2028-07-10&checkOut=2028-07-12')
    const bookBtns = page.locator('[data-testid^="btn-book-"]')
    await expect(bookBtns).toHaveCount(2) // hotel 2 has 2 rooms
  })

  test('"Book now" links to the booking page with correct params', async ({ page }) => {
    await page.goto('/hotels/1?checkIn=2028-08-01&checkOut=2028-08-03')
    await page.getByTestId('btn-book-r2').click()
    await expect(page).toHaveURL(/\/book\?roomId=r2&checkIn=2028-08-01&checkOut=2028-08-03/)
  })

  test('changing dates and re-checking availability reloads rooms', async ({ page }) => {
    await page.goto('/hotels/1?checkIn=2028-08-10&checkOut=2028-08-12')
    await page.getByTestId('check-in').fill('2028-09-01')
    await page.getByTestId('check-out').fill('2028-09-04')
    await page.getByTestId('btn-check-availability').click()
    await expect(page.getByTestId('room-card')).toHaveCount(3)
  })
})
