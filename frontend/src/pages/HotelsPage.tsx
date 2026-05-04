import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Header from '../components/Header'
import type { Hotel } from '../types'

function today() { return new Date().toISOString().slice(0, 10) }
function tomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [checkIn, setCheckIn] = useState(today())
  const [checkOut, setCheckOut] = useState(tomorrow())
  const [error, setError] = useState('')

  useEffect(() => {
    api.getHotels()
      .then(setHotels)
      .catch(() => setError('Failed to load hotels.'))
  }, [])

  function handleCheckInChange(val: string) {
    setCheckIn(val)
    if (val >= checkOut) {
      const d = new Date(val); d.setDate(d.getDate() + 1)
      setCheckOut(d.toISOString().slice(0, 10))
    }
  }

  return (
    <>
      <Header />
      <main className="page">
        <h1 className="page-title">Our Hotels</h1>
        <p className="page-sub">Three exceptional luxury properties in Bondi, Sydney</p>

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
          <Link
            to={`/hotels/${hotels[0]?.id ?? '1'}?checkIn=${checkIn}&checkOut=${checkOut}`}
            className="btn btn-primary"
            style={{ display: 'none' }}
          />
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="hotel-grid">
          {hotels.map(hotel => (
            <article className="card" key={hotel.id} data-testid="hotel-card">
              <div className={`hotel-hero ${hotel.theme}`}>
                <span className="hotel-badge">★★★★★ Luxury</span>
              </div>
              <div className="hotel-body">
                <div className="hotel-name" data-testid="hotel-name">{hotel.name}</div>
                <div className="hotel-tagline">{hotel.tagline}</div>
                <div className="hotel-location">📍 {hotel.location}</div>
                <p className="hotel-desc">{hotel.description}</p>
                <div className="hotel-footer">
                  <div className="price-from">From <strong>${hotel.price_from.toLocaleString()}</strong> / night</div>
                  <Link
                    to={`/hotels/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}`}
                    className="btn btn-primary"
                    data-testid={`btn-view-hotel-${hotel.id}`}
                  >
                    View rooms
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  )
}
