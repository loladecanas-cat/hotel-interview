import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { session } from '../session'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session.getUser()) navigate('/hotels', { replace: true })
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Please enter your email address.')
    setLoading(true)
    try {
      const user = await api.createUser(email.trim())
      session.setUser(user)
      navigate('/hotels')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hero">
      <div className="hero-content">
        <h1 className="hero-title">Escape to <span>Bondi</span></h1>
        <p className="hero-sub">Sydney's finest luxury hotels steps from the iconic beach</p>

        <div className="form-card">
          <p className="form-section">Sign in or create account</p>
          {error && <div className="alert alert-error" data-testid="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                data-testid="email-input"
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              className="btn btn-gold btn-block btn-lg"
              data-testid="btn-continue"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
