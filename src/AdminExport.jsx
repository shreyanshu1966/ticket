import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildApiUrl } from './config'

const AdminExport = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    paymentStatus: '',
    year: '',
    isGroupBooking: ''
  })
  const navigate = useNavigate()

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const exportToCSV = (data) => {
    if (!data || data.length === 0) {
      alert('No data to export')
      return
    }

    // Get headers from the first object
    const headers = Object.keys(data[0])
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `registrations-export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus)
      if (filters.year) params.append('year', filters.year)

      const response = await fetch(buildApiUrl(`/api/admin/export/registrations?${params}`), {
        headers: getAuthHeaders()
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }

      const data = await response.json()
      if (data.success) {
        exportToCSV(data.data)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Error exporting data')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Export Registrations</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Export registration data to CSV format. Use the filters below to customize your export.
            </p>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  name="paymentStatus"
                  value={filters.paymentStatus}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed Only</option>
                  <option value="pending">Pending Only</option>
                  <option value="failed">Failed Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <select
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Post Graduate">Post Graduate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Type
                </label>
                <select
                  name="isGroupBooking"
                  value={filters.isGroupBooking}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Bookings</option>
                  <option value="true">Group Bookings Only</option>
                  <option value="false">Individual Bookings Only</option>
                </select>
              </div>
            </div>

            {/* Export Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Export will include:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Basic Info: Name, Email, Phone, College, Year</li>
                <li>• Booking Details: Type (Group/Individual), Ticket Quantity</li>
                <li>• Payment Info: Status, Amount, UPI Transaction ID</li>
                <li>• Savings: Free tickets and amount saved from offers</li>
                <li>• Timestamps: Registration, Payment, Admin verification</li>
                <li>• Status: Ticket generation, Email delivery, Entry scanning</li>
              </ul>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={handleExport}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </span>
                ) : (
                  '📊 Export to CSV'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Export Options */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setFilters({ paymentStatus: 'completed', year: '' })
              setTimeout(handleExport, 100)
            }}
            disabled={loading}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-center font-medium transition-colors disabled:opacity-50"
          >
            📋 Export Paid Registrations
          </button>
          
          <button
            onClick={() => {
              setFilters({ paymentStatus: 'pending', year: '' })
              setTimeout(handleExport, 100)
            }}
            disabled={loading}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-center font-medium transition-colors disabled:opacity-50"
          >
            ⏳ Export Pending Payments
          </button>
          
          <button
            onClick={() => {
              setFilters({ paymentStatus: '', year: '' })
              setTimeout(handleExport, 100)
            }}
            disabled={loading}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-center font-medium transition-colors disabled:opacity-50"
          >
            📊 Export All Data
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminExport