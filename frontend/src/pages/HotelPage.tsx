import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { api } from '../api'
import Header from '../components/Header'
import type { Hotel, Room } from '../types'

function today() { return new Date().toISOString().slice(0, 10) }
function tomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}
function fmt(iso: string) {
  const [y, m, d] = iso.split('-')
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function HotelPage() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [available, setAvailable] = useState<Room[]>([])
  const [checkIn, setCheckIn] = useState(params.get('checkIn') ?? today())
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? tomorrow())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    api.getHotel(id).then(setHotel).catch(() => setError('Hotel not found.'))
  }, [id])

  useEffect(() => {
    if (id) checkAvailability()
  }, [id]) // run on mount with initial dates

  async function checkAvailability() {
    if (!id || !checkIn || !checkOut || checkOut <= checkIn) return
    setLoading(true)
    setError('')
    try {
      const rooms = await api.getAvailability(id, checkIn, checkOut)
      setAvailable(rooms)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load availability.')
    } finally {
      setLoading(false)
    }
  }

  function handleCheckInChange(val: string) {
    setCheckIn(val)
    if (val >= checkOut) {
      const d = new Date(val); d.setDate(d.getDate() + 1)
      setCheckOut(d.toISOString().slice(0, 10))
    }
  }

  const availableIds = new Set(available.map(r => r.id))
  const nights = checkIn && checkOut ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0

  return (
    <>
      <Header />
      <main className="page">
        <Link to="/hotels" className="back-link">← Back to hotels</Link>

        {hotel && (
          <>
            <div className={`hotel-banner ${hotel.theme}`}>
              <div>
                <div className="stars">★★★★★</div>
                <div className="banner-name">{hotel.name}</div>
                <div className="banner-tagline">{hotel.tagline}</div>
                <div className="banner-loc">📍 {hotel.location}</div>
              </div>
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>{hotel.description}</p>
          </>
        )}

        <div className="date-bar">
          <div className="form-group">
            <label htmlFor="check-in">Check-in</label>
            <input
              id="check-in"
              type="date"
              value={checkIn}
              min={today()}
              onChange={e => handleCheckInChange(e.target.value)}
              data-testid="check-in"
            />
          </div>
          <div className="form-group">
            <label htmlFor="check-out">Check-out</label>
            <input
              id="check-out"
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={e => setCheckOut(e.target.value)}
              data-testid="check-out"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={checkAvailability}
            disabled={loading}
            data-testid="btn-check-availability"
          >
            {loading ? 'Checking…' : 'Check availability'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {hotel && (
          <>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '.25rem' }}>
              Available Rooms
            </h2>
            {nights > 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginBottom: '.75rem' }}>
                {fmt(checkIn)} → {fmt(checkOut)} · {nights} night{nights !== 1 ? 's' : ''}
              </p>
            )}
            <div className="room-list">
              {hotel.rooms.map(room => {
                const isAvailable = availableIds.has(room.id)
                const total = nights * room.price_per_night
                return (
                  <div
                    key={room.id}
                    className={`room-card${isAvailable ? '' : ' unavailable'}`}
                    data-testid="room-card"
                    data-room-id={room.id}
                  >
                    <div className="room-info">
                      <div className="room-name">{room.name}</div>
                      <span className="room-type">{room.type}</span>
                      <p className="room-desc">{room.description}</p>
                      <p className="room-guests">Up to {room.max_guests} guest{room.max_guests > 1 ? 's' : ''}</p>
                    </div>
                    <div className="room-price-col">
                      <div className="room-price">${room.price_per_night.toLocaleString()}</div>
                      <div className="room-price-label">per night</div>
                      {nights > 0 && (
                        <div className="room-price-label" style={{ marginTop: '.3rem' }}>
                          Total: ${total.toLocaleString()}
                        </div>
                      )}
                      <div style={{ marginTop: '.9rem' }}>
                        {isAvailable ? (
                          <Link
                            to={`/book?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}`}
                            className="btn btn-gold"
                            data-testid={`btn-book-${room.id}`}
                          >
                            Book now
                          </Link>
                        ) : (
                          <span className="btn btn-outline" style={{ cursor: 'not-allowed', opacity: .5 }}>
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </>
  )
}
