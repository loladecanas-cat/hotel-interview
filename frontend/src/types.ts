export interface User {
  id: string
  email: string
  created_at: string
}

export interface Room {
  id: string
  name: string
  type: string
  price_per_night: number
  max_guests: number
  description: string
}

export interface Hotel {
  id: string
  name: string
  tagline: string
  location: string
  description: string
  price_from: number
  theme: string
  rooms: Room[]
}

export interface Booking {
  id: string
  user_id: string
  hotel_id: string
  hotel_name: string
  hotel_location: string
  room_id: string
  room_name: string
  room_type: string
  check_in: string
  check_out: string
  nights: number
  price_per_night: number
  total: number
  payment: { last4: string; card_name: string }
  created_at: string
}
