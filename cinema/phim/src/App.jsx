import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MovieListPage from './pages/MovieListPage'
import MovieDetailPage from './pages/MovieDetailPage'
import BookingPage from './pages/BookingPage'
import PaymentPage from './pages/PaymentPage'
import MyBookingsPage from './pages/MyBookingsPage'
import ProfilePage from './pages/ProfilePage'
import AdminMoviesPage from './pages/admin/AdminMoviesPage'
import AdminShowtimesPage from './pages/admin/AdminShowtimesPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminRoomStatsPage from './pages/admin/AdminRoomStatsPage'
import AdminReviewsPage from './pages/admin/AdminReviewsPage'
import AdminVouchersPage from './pages/admin/AdminVouchersPage'
import AdminFooterPage from './pages/admin/AdminFooterPage'
import AdminSupportPage from './pages/admin/AdminSupportPage'
import AdminFeedbacksPage from './pages/admin/AdminFeedbacksPage'
import OffersPage from './pages/OffersPage'
import HelpCenterPage from './pages/HelpCenterPage'
import ContactPage from './pages/ContactPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleToggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="app-container">
      <NavBar theme={theme} onToggleTheme={handleToggleTheme} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/movies" element={<MovieListPage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/booking/:showtimeId" element={
            <PrivateRoute><BookingPage /></PrivateRoute>
          } />
          <Route path="/payment" element={
            <PrivateRoute><PaymentPage /></PrivateRoute>
          } />
          <Route path="/my-bookings" element={
            <PrivateRoute><MyBookingsPage /></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><ProfilePage /></PrivateRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />
          <Route path="/admin/movies" element={
            <AdminRoute><AdminMoviesPage /></AdminRoute>
          } />
          <Route path="/admin/showtimes" element={
            <AdminRoute><AdminShowtimesPage /></AdminRoute>
          } />
          <Route path="/admin/bookings" element={
            <AdminRoute><AdminBookingsPage /></AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute><AdminUsersPage /></AdminRoute>
          } />
          <Route path="/admin/reviews" element={
            <AdminRoute><AdminReviewsPage /></AdminRoute>
          } />
          <Route path="/admin/vouchers" element={
            <AdminRoute><AdminVouchersPage /></AdminRoute>
          } />
          <Route path="/admin/room-stats" element={
            <AdminRoute><AdminRoomStatsPage /></AdminRoute>
          } />
          <Route path="/admin/footer" element={
            <AdminRoute><AdminFooterPage /></AdminRoute>
          } />
          <Route path="/admin/support" element={
            <AdminRoute><AdminSupportPage /></AdminRoute>
          } />
          <Route path="/admin/feedbacks" element={
            <AdminRoute><AdminFeedbacksPage /></AdminRoute>
          } />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
