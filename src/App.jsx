import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import EventForm from './EventForm'
import PaymentPage from './PaymentPage'
import QRScanner from './QRScanner'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'
import AdminRegistrations from './AdminRegistrations'
import AdminExport from './AdminExport'
import AdminNotifications from './AdminNotifications'
import AdminEntries from './AdminEntries'
import BringFriendForm from './BringFriendForm'
import ProtectedRoute from './ProtectedRoute'
import TicketPreview from './TicketPreview'
import './App.css'

function Navigation() {
  const location = useLocation()

  // Don't show main navigation on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null
  }

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">ACD 2026 Event System</h1>
        <div className="flex gap-4">
          <Link
            to="/"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/'
              ? 'bg-blue-800'
              : 'hover:bg-blue-500'
              }`}
          >
            📝 Registration
          </Link>
          <Link
            to="/scanner"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/scanner'
              ? 'bg-blue-800'
              : 'hover:bg-blue-500'
              }`}
          >
            📱 Scanner
          </Link>
          <Link
            to="/bring-friend"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/bring-friend'
              ? 'bg-blue-800'
              : 'hover:bg-blue-500'
              }`}
          >
            🎉 Bring Friend
          </Link>
          <Link
            to="/admin/login"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/admin/login'
              ? 'bg-blue-800'
              : 'hover:bg-blue-500'
              }`}
          >
            🔐 Admin
          </Link>
          <Link
            to="/ticket-preview"
            className={`px-4 py-1 rounded-lg font-medium transition-colors ${location.pathname === '/ticket-preview'
              ? 'bg-blue-800'
              : 'hover:bg-blue-500'
              }`}
          >
            🎟️ Ticket
          </Link>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>


      <Routes>
        <Route path="/" element={<EventForm />} />
        <Route path="/payment/:id" element={<PaymentPage />} />
        <Route path="/bring-friend" element={<BringFriendForm />} />
        <Route path="/scanner" element={<QRScanner />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/registrations" element={
          <ProtectedRoute>
            <AdminRegistrations />
          </ProtectedRoute>
        } />
        <Route path="/admin/export" element={
          <ProtectedRoute>
            <AdminExport />
          </ProtectedRoute>
        } />
        <Route path="/admin/notifications" element={
          <ProtectedRoute>
            <AdminNotifications />
          </ProtectedRoute>
        } />
        <Route path="/admin/entries" element={
          <ProtectedRoute>
            <AdminEntries />
          </ProtectedRoute>
        } />
        <Route path="/ticket-preview" element={<TicketPreview />} />
      </Routes>

    </Router>
  )

}

export default App
