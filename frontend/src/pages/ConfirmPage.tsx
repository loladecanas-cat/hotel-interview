import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import Header from '../components/Header'
import type { Booking } from '../types'

function fmt(iso: string) {
  const [y, m, d] = iso.split('-')
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ConfirmPage() {
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) api.getBooking(id).then(setBooking).catch(() => setError('Booking not found.'))
  }, [id])

  return (
    <>
      <Header />
      <main className="page-narrow" style={{ paddingTop: '3rem' }}>
        {error && <div className="alert alert-error">{error}</div>}
        {booking && (
          <div className="form-card text-center">
            <div className="confirm-icon">✓</div>
            <p style={{ fontSize: '.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.4rem' }}>
              Booking confirmed
            </p>
            <div className="confirm-ref" data-testid="booking-ref">{booking.id}</div>
            <p className="confirm-label">A confirmation has been sent to your email</p>

            <div className="summary" data-testid="confirm-summary">
              <div className="summary-row"><span>Hotel</span><strong>{booking.hotel_name}</strong></div>
              <div className="summary-row"><span>Room</span><strong>{booking.room_name} ({booking.room_type})</strong></div>
              <div className="summary-row"><span>Check-in</span><strong>{fmt(booking.check_in)}</strong></div>
              <div className="summary-row"><span>Check-out</span><strong>{fmt(booking.check_out)}</strong></div>
              <div className="summary-row"><span>Duration</span><strong>{booking.nights} night{booking.nights !== 1 ? 's' : ''}</strong></div>
              <div className="summary-row"><span>Card</span><strong>•••• {booking.payment.last4}</strong></div>
              <div className="summary-row total"><span>Total paid</span><span>${booking.total.toLocaleString()}</span></div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/my-bookings" className="btn btn-primary" data-testid="btn-view-bookings">
                View my bookings
              </Link>
              <Link to="/hotels" className="btn btn-outline" data-testid="btn-back-to-hotels">
                Browse hotels
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
