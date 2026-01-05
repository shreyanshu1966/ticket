import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import EventForm from './EventForm'
import QRScanner from './QRScanner'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'
import AdminRegistrations from './AdminRegistrations'
import AdminExport from './AdminExport'
import AdminNotifications from './AdminNotifications'
import ProtectedRoute from './ProtectedRoute'
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
        <h1 className="text-xl font-bold">ACD 2025 Event System</h1>
        <div className="flex gap-4">
          <Link 
            to="/" 
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              location.pathname === '/' 
                ? 'bg-blue-800' 
                : 'hover:bg-blue-500'
            }`}
          >
            📝 Registration
          </Link>
          <Link 
            to="/scanner" 
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              location.pathname === '/scanner' 
                ? 'bg-blue-800' 
                : 'hover:bg-blue-500'
            }`}
          >
            📱 Scanner
          </Link>
          <Link 
            to="/admin/login" 
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              location.pathname === '/admin/login' 
                ? 'bg-blue-800' 
                : 'hover:bg-blue-500'
            }`}
          >
            🔐 Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<EventForm />} />
          <Route path="/scanner" element={<QRScanner />} />
          <Route path="/admin/login" element={<AdminLogin />} />
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
        </Routes>
      </div>
    </Router>
  )
  
}

export default App
