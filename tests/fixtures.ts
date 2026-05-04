import { Page, expect } from '@playwright/test'

let _counter = 0

/** Unique email per call, safe across parallel-ish tests */
export function uniqueEmail(): string {
  return `test-${Date.now()}-${++_counter}@bondi.test`
}

/** Dates far enough in the future to avoid conflicts across runs */
export const DATES = {
  // Each block is a non-overlapping window assigned to a specific test concern
  happyPath:  { checkIn: '2028-03-01', checkOut: '2028-03-03' }, // r2 – 2 nights
  conflict:   { checkIn: '2028-04-10', checkOut: '2028-04-13' }, // r3 – 3 nights
  myBookings: { checkIn: '2028-05-01', checkOut: '2028-05-04' }, // r5 – 3 nights
}

/**
 * Creates a user via the API and injects them into localStorage so the
 * browser session is authenticated without going through the UI login.
 */
export async function loginAs(page: Page, email = uniqueEmail()) {
  const res = await page.request.post('/api/users', { data: { email } })
  expect(res.ok()).toBeTruthy()
  const user = await res.json()
  // Navigate somewhere first so we have an origin to write localStorage into
  await page.goto('/')
  await page.evaluate((u: object) => localStorage.setItem('hb_user', JSON.stringify(u)), user)
  return user as { id: string; email: string }
}

/**
 * Creates a booking directly via the API (no UI interaction).
 * Useful for seeding state before testing the My Bookings page.
 */
export async function createBooking(
  page: Page,
  userId: string,
  roomId: string,
  checkIn: string,
  checkOut: string,
) {
  const res = await page.request.post('/api/bookings', {
    data: {
      user_id: userId,
      room_id: roomId,
      check_in: checkIn,
      check_out: checkOut,
      payment: { card_name: 'Test User', card_number: '4111111111116767', card_expiry: '12/28', card_cvv: '123' },
    },
  })
  expect(res.status()).toBe(201)
  return res.json() as Promise<{ id: string; total: number }>
}
