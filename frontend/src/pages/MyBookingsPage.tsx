import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { session } from '../session'
import Header from '../components/Header'
import type { Booking } from '../types'

function fmt(iso: string) {
  const [y, m, d] = iso.split('-')
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getStatus(checkIn: string, checkOut: string) {
  const now = new Date().toISOString().slice(0, 10)
  if (checkOut < now) return { label: 'Completed', cls: 'badge-completed' }
  if (checkIn <= now)  return { label: 'Active',    cls: 'badge-active' }
  return                      { label: 'Upcoming',  cls: 'badge-upcoming' }
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const user = session.getUser()

  useEffect(() => {
    if (!user) return
    api.getBookings(user.id)
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          const now = new Date().toISOString().slice(0, 10)
          const rank = (x: Booking) => x.check_out < now ? 2 : x.check_in <= now ? 1 : 0
          return rank(a) - rank(b) || a.check_in.localeCompare(b.check_in)
        })
        setBookings(sorted)
      })
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoaded(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Header />
      <main className="page">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-sub">{user?.email}</p>

        {error && <div className="alert alert-error">{error}</div>}

        {loaded && bookings.length === 0 && (
          <div className="empty" data-testid="empty-state">
            <div className="empty-icon">🏨</div>
            <div className="empty-title">No bookings yet</div>
            <p className="empty-sub">Your upcoming stays will appear here.</p>
            <Link to="/hotels" className="btn btn-gold" data-testid="btn-browse-hotels">
              Browse hotels
            </Link>
          </div>
        )}

        <div className="booking-list">
          {bookings.map(b => {
            const status = getStatus(b.check_in, b.check_out)
            return (
              <article className="booking-card" key={b.id} data-testid="booking-card">
                <div className="booking-info">
                  <div className="booking-hotel">
                    {b.hotel_name}
                    <span className={`badge ${status.cls}`} data-testid="booking-status">{status.label}</span>
                  </div>
                  <div className="booking-room">{b.room_name} · {b.room_type}</div>
                  <div className="booking-detail">
                    📅 {fmt(b.check_in)} → {fmt(b.check_out)}<br />
                    🌙 {b.nights} night{b.nights !== 1 ? 's' : ''}<br />
                    📍 {b.hotel_location}
                  </div>
                </div>
                <div className="booking-aside">
                  <div className="booking-ref-label">Booking ref</div>
                  <div className="booking-ref-val" data-testid={`booking-ref-${b.id}`}>{b.id}</div>
                  <div className="booking-total">${b.total.toLocaleString()}</div>
                  <div className="booking-card-label">Card •••• {b.payment.last4}</div>
                </div>
              </article>
            )
          })}
        </div>
      </main>
    </>
  )
}
