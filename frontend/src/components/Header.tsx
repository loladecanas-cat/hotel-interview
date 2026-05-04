import { Link, NavLink, useNavigate } from 'react-router-dom'
import { session } from '../session'

export default function Header() {
  const navigate = useNavigate()
  const user = session.getUser()

  function signOut() {
    session.clear()
    navigate('/')
  }

  return (
    <header className="header">
      <Link to="/hotels" className="header-logo">
        Bondi <span>Luxury Hotels</span>
      </Link>
      <nav className="header-nav">
        <NavLink to="/my-bookings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} data-testid="nav-my-bookings">
          My bookings
        </NavLink>
        {user && <span className="header-user">{user.email}</span>}
        <button className="nav-link" onClick={signOut} data-testid="btn-sign-out">
          Sign out
        </button>
      </nav>
    </header>
  )
}
