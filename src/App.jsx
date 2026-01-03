import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import EventForm from './EventForm'
import QRScanner from './QRScanner'
import './App.css'

function Navigation() {
  const location = useLocation()
  
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
        </Routes>
      </div>
    </Router>
  )
}

export default App
