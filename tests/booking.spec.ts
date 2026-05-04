import { test, expect } from '@playwright/test'
import { loginAs, createBooking, DATES } from './fixtures'

test.describe('Booking flow — happy path', () => {
  test('completes a full booking and shows confirmation ref', async ({ page }) => {
    const user = await loginAs(page)

    // Start on the hotel page with dates pre-set in the URL
    await page.goto(`/hotels/1?checkIn=${DATES.happyPath.checkIn}&checkOut=${DATES.happyPath.checkOut}`)
    await expect(page.getByTestId('room-card')).toHaveCount(3)

    // Pick a room
    await page.getByTestId('btn-book-r2').click()
    await expect(page).toHaveURL(/\/book/)

    // Booking summary should show hotel and room
    await expect(page.getByTestId('booking-summary')).toContainText('The Bondi Grand')
    await expect(page.getByTestId('booking-summary')).toContainText('Deluxe King')

    // Guest email is pre-filled from session
    await expect(page.getByTestId('guest-email')).toHaveValue(user.email)

    // Fill payment
    await page.getByTestId('card-name').fill('Jane Smith')
    await page.getByTestId('card-number').fill('4111 1111 1111 6767')
    await page.getByTestId('card-expiry').fill('12/28')
    await page.getByTestId('card-cvv').fill('123')

    await page.getByTestId('btn-confirm-booking').click()

    // Redirected to confirmation
    await expect(page).toHaveURL(/\/confirm\/BND-/)
    const ref = page.getByTestId('booking-ref')
    await expect(ref).toBeVisible()
    await expect(ref).toContainText('BND-')

    // Summary on confirm page
    await expect(page.getByTestId('confirm-summary')).toContainText('The Bondi Grand')
    await expect(page.getByTestId('confirm-summary')).toContainText('Deluxe King')
  })
})

test.describe('Booking flow — payment validation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto(`/hotels/1?checkIn=2028-10-01&checkOut=2028-10-03`)
    // Wait for availability to load before clicking
    await page.getByTestId('btn-book-r1').waitFor({ state: 'visible' })
    await page.getByTestId('btn-book-r1').click()
  })

  test('declines a card not ending in 6767', async ({ page }) => {
    await page.getByTestId('card-name').fill('John Doe')
    await page.getByTestId('card-number').fill('4111 1111 1111 1234')
    await page.getByTestId('card-expiry').fill('12/28')
    await page.getByTestId('card-cvv').fill('123')
    await page.getByTestId('btn-confirm-booking').click()
    await expect(page.getByTestId('payment-error')).toContainText('Payment declined')
    await expect(page).toHaveURL(/\/book/) // stays on booking page
  })

  test('shows error when card name is missing', async ({ page }) => {
    await page.getByTestId('card-number').fill('4111 1111 1111 6767')
    await page.getByTestId('card-expiry').fill('12/28')
    await page.getByTestId('card-cvv').fill('123')
    await page.getByTestId('btn-confirm-booking').click()
    await expect(page.getByTestId('payment-error')).toContainText('name on your card')
  })

  test('shows error for a short card number', async ({ page }) => {
    await page.getByTestId('card-name').fill('Jane Smith')
    await page.getByTestId('card-number').fill('4111')
    await page.getByTestId('card-expiry').fill('12/28')
    await page.getByTestId('card-cvv').fill('123')
    await page.getByTestId('btn-confirm-booking').click()
    await expect(page.getByTestId('payment-error')).toContainText('16-digit')
  })

  test('shows error for invalid expiry format', async ({ page }) => {
    await page.getByTestId('card-name').fill('Jane Smith')
    await page.getByTestId('card-number').fill('4111 1111 1111 6767')
    // '1' stays as '1' — does not auto-format to MM/YY, so validation fails
    await page.getByTestId('card-expiry').fill('1')
    await page.getByTestId('card-cvv').fill('123')
    await page.getByTestId('btn-confirm-booking').click()
    await expect(page.getByTestId('payment-error')).toContainText('MM/YY')
  })

  test('shows error for missing CVV', async ({ page }) => {
    await page.getByTestId('card-name').fill('Jane Smith')
    await page.getByTestId('card-number').fill('4111 1111 1111 6767')
    await page.getByTestId('card-expiry').fill('12/28')
    // CVV left empty
    await page.getByTestId('btn-confirm-booking').click()
    await expect(page.getByTestId('payment-error')).toContainText('CVV')
  })
})

test.describe('Booking flow — availability conflict', () => {
  test('booked room shows as unavailable for overlapping dates', async ({ page }) => {
    const user = await loginAs(page)

    // Book r3 via API
    await createBooking(page, user.id, 'r3', DATES.conflict.checkIn, DATES.conflict.checkOut)

    // Visit hotel 1 with overlapping dates
    await page.goto(`/hotels/1?checkIn=${DATES.conflict.checkIn}&checkOut=${DATES.conflict.checkOut}`)

    // r3 (Grand Penthouse) should be unavailable — no Book button
    await expect(page.getByTestId('btn-book-r3')).toHaveCount(0)

    // Other rooms in hotel 1 are still bookable
    await expect(page.getByTestId('btn-book-r1')).toBeVisible()
    await expect(page.getByTestId('btn-book-r2')).toBeVisible()
  })
})
