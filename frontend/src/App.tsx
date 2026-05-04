import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { session } from './session'
import LoginPage from './pages/LoginPage'
import HotelsPage from './pages/HotelsPage'
import HotelPage from './pages/HotelPage'
import BookPage from './pages/BookPage'
import ConfirmPage from './pages/ConfirmPage'
import MyBookingsPage from './pages/MyBookingsPage'

function Guard({ children }: { children: React.ReactNode }) {
  return session.getUser() ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/hotels" element={<Guard><HotelsPage /></Guard>} />
        <Route path="/hotels/:id" element={<Guard><HotelPage /></Guard>} />
        <Route path="/book" element={<Guard><BookPage /></Guard>} />
        <Route path="/confirm/:id" element={<Guard><ConfirmPage /></Guard>} />
        <Route path="/my-bookings" element={<Guard><MyBookingsPage /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
