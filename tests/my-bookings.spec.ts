import { test, expect } from '@playwright/test'
import { loginAs, createBooking, DATES } from './fixtures'

test.describe('My Bookings page', () => {
  test('shows empty state when user has no bookings', async ({ page }) => {
    await loginAs(page)
    await page.goto('/my-bookings')
    await expect(page.getByTestId('empty-state')).toBeVisible()
    await expect(page.getByTestId('btn-browse-hotels')).toBeVisible()
  })

  test('"Browse hotels" from empty state navigates to /hotels', async ({ page }) => {
    await loginAs(page)
    await page.goto('/my-bookings')
    await page.getByTestId('btn-browse-hotels').click()
    await expect(page).toHaveURL('/hotels')
  })

  test('shows a booking after it is created via API', async ({ page }) => {
    const user = await loginAs(page)
    const booking = await createBooking(page, user.id, 'r5', DATES.myBookings.checkIn, DATES.myBookings.checkOut)

    await page.goto('/my-bookings')

    await expect(page.getByTestId('booking-card')).toHaveCount(1)
    await expect(page.getByTestId(`booking-ref-${booking.id}`)).toContainText(booking.id)
  })

  test('shows the hotel name, room name and total for a booking', async ({ page }) => {
    const user = await loginAs(page)
    await createBooking(page, user.id, 'r4', '2028-06-01', '2028-06-04') // r4 = Pearl Suite, hotel 2

    await page.goto('/my-bookings')

    const card = page.getByTestId('booking-card').first()
    await expect(card).toContainText('Pacific Pearl Bondi')
    await expect(card).toContainText('Pearl Suite')
    await expect(card).toContainText('$2,160') // 3 nights × $720
  })

  test('upcoming booking has "Upcoming" status badge', async ({ page }) => {
    const user = await loginAs(page)
    await createBooking(page, user.id, 'r7', '2029-01-10', '2029-01-12')

    await page.goto('/my-bookings')
    await expect(page.getByTestId('booking-status').first()).toContainText('Upcoming')
  })

  test('shows multiple bookings and lists them', async ({ page }) => {
    const user = await loginAs(page)
    await createBooking(page, user.id, 'r6', '2028-11-01', '2028-11-03')
    await createBooking(page, user.id, 'r8', '2028-12-01', '2028-12-02')

    await page.goto('/my-bookings')
    await expect(page.getByTestId('booking-card')).toHaveCount(2)
  })

  test('confirm page "View my bookings" button navigates to /my-bookings', async ({ page }) => {
    const user = await loginAs(page)
    const booking = await createBooking(page, user.id, 'r1', '2029-03-01', '2029-03-02')

    await page.goto(`/confirm/${booking.id}`)
    await page.getByTestId('btn-view-bookings').click()
    await expect(page).toHaveURL('/my-bookings')
  })
})
