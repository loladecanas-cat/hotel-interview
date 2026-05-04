import type { User, Hotel, Room, Booking } from './types'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? 'Request failed')
  return data as T
}

export const api = {
  createUser: (email: string) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify({ email }) }),

  getHotels: () => request<Hotel[]>('/hotels'),

  getHotel: (id: string) => request<Hotel>(`/hotels/${id}`),

  getAvailability: (hotelId: string, checkIn: string, checkOut: string) =>
    request<Room[]>(`/availability?hotel_id=${hotelId}&check_in=${checkIn}&check_out=${checkOut}`),

  createBooking: (payload: {
    user_id: string
    room_id: string
    check_in: string
    check_out: string
    payment: { card_name: string; card_number: string; card_expiry: string; card_cvv: string }
  }) => request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),

  getBookings: (userId: string) => request<Booking[]>(`/bookings?user_id=${userId}`),

  getBooking: (id: string) => request<Booking>(`/bookings/${id}`),
}
