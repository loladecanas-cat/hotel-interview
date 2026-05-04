import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import { session } from '../session'
import Header from '../components/Header'
import type { Hotel, Room } from '../types'

function fmt(iso: string) {
  const [y, m, d] = iso.split('-')
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BookPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const roomId  = params.get('roomId')  ?? ''
  const checkIn  = params.get('checkIn')  ?? ''
  const checkOut = params.get('checkOut') ?? ''

  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [room, setRoom]   = useState<Room | null>(null)
  const [cardName,   setCardName]   = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv,    setCardCvv]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const user = session.getUser()

  useEffect(() => {
    if (!roomId) return
    api.getHotels().then(hotels => {
      for (const h of hotels) {
        const r = h.rooms.find(r => r.id === roomId)
        if (r) { setHotel(h); setRoom(r); break }
      }
    })
  }, [roomId])

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0
  const total = room ? nights * room.price_per_night : 0

  function formatCardNumber(val: string) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }
  function formatExpiry(val: string) {
    const d = val.replace(/\D/g, '').slice(0, 4)
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!cardName.trim()) return setError('Please enter the name on your card.')
    if (cardNumber.replace(/\s/g, '').length < 16) return setError('Please enter a valid 16-digit card number.')
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) return setError('Please enter expiry in MM/YY format.')
    if (!/^\d{3,4}$/.test(cardCvv)) return setError('Please enter a valid CVV.')
    if (!user) return

    setLoading(true)
    try {
      const booking = await api.createBooking({
        user_id: user.id,
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        payment: { card_name: cardName, card_number: cardNumber.replace(/\s/g, ''), card_expiry: cardExpiry, card_cvv: cardCvv },
      })
      navigate(`/confirm/${booking.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="page-narrow">
        <Link to={hotel ? `/hotels/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}` : '/hotels'} className="back-link">
          ← Back
        </Link>
        <h1 className="page-title">Complete your booking</h1>

        {hotel && room && (
          <div className="summary" data-testid="booking-summary">
            <div className="summary-row"><span>Hotel</span><strong>{hotel.name}</strong></div>
            <div className="summary-row"><span>Room</span><strong>{room.name}</strong></div>
            <div className="summary-row"><span>Check-in</span><strong>{fmt(checkIn)}</strong></div>
            <div className="summary-row"><span>Check-out</span><strong>{fmt(checkOut)}</strong></div>
            <div className="summary-row"><span>Nights</span><strong>{nights}</strong></div>
            <div className="summary-row"><span>${room.price_per_night.toLocaleString()} × {nights}</span><strong>${total.toLocaleString()}</strong></div>
            <div className="summary-row total"><span>Total</span><span>${total.toLocaleString()}</span></div>
          </div>
        )}

        <form className="form-card" onSubmit={handleSubmit} noValidate>
          <p className="form-section">Guest details</p>
          <div className="form-group">
            <label>Email address</label>
            <input value={user?.email ?? ''} readOnly data-testid="guest-email" />
          </div>

          <hr className="divider" />
          <p className="form-section">Payment details</p>

          {error && <div className="alert alert-error" data-testid="payment-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="card-name">Name on card</label>
            <input
              id="card-name"
              type="text"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              placeholder="Jane Smith"
              data-testid="card-name"
              autoComplete="cc-name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="card-number">Card number</label>
            <input
              id="card-number"
              type="text"
              value={cardNumber}
              onChange={e => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 6767"
              maxLength={19}
              data-testid="card-number"
              autoComplete="cc-number"
            />
            <p className="form-hint">Hint: use any number ending in <strong>6767</strong> to approve payment</p>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="card-expiry">Expiry (MM/YY)</label>
              <input
                id="card-expiry"
                type="text"
                value={cardExpiry}
                onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                placeholder="12/28"
                maxLength={5}
                data-testid="card-expiry"
                autoComplete="cc-exp"
              />
            </div>
            <div className="form-group">
              <label htmlFor="card-cvv">CVV</label>
              <input
                id="card-cvv"
                type="text"
                value={cardCvv}
                onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                maxLength={4}
                data-testid="card-cvv"
                autoComplete="cc-csc"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-gold btn-block btn-lg"
            disabled={loading}
            data-testid="btn-confirm-booking"
            style={{ marginTop: '.5rem' }}
          >
            {loading ? 'Processing payment…' : 'Confirm booking'}
          </button>
        </form>
      </main>
    </>
  )
}
