import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildApiUrl } from './config'
import PaymentVerificationModal from './PaymentVerificationModal'

const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    paymentStatus: '',
    year: '',
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({})
  const [updating, setUpdating] = useState('')
  const [loadingRegistration, setLoadingRegistration] = useState('') // Track which registration is being loaded
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const navigate = useNavigate()

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(buildApiUrl(`/api/admin/registrations?${params}`), {
        headers: getAuthHeaders()
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }

      const data = await response.json()
      if (data.success) {
        setRegistrations(data.data)
        setPagination(data.pagination)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Error fetching registrations')
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentStatus = async (id, newStatus) => {
    try {
      setUpdating(id)
      const response = await fetch(buildApiUrl(`/api/registrations/${id}/payment-status`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ paymentStatus: newStatus })
      })

      const data = await response.json()
      if (data.success) {
        // Update local state
        setRegistrations(prev =>
          prev.map(reg =>
            reg._id === id ? { ...reg, paymentStatus: newStatus } : reg
          )
        )
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Error updating payment status')
    } finally {
      setUpdating('')
    }
  }

  const verifyPayment = async (id, approved, notes = '', rejectionReason = '') => {
    try {
      const response = await fetch(buildApiUrl(`/api/registrations/${id}/verify`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          approved,
          notes,
          rejectionReason
        })
      })

      const data = await response.json()
      if (data.success) {
        // Update local state
        setRegistrations(prev =>
          prev.map(reg =>
            reg._id === id ? data.data : reg
          )
        )
        alert(approved ? 'Payment approved and ticket sent!' : 'Payment rejected')
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Error verifying payment')
    }
  }

  const openVerificationModal = async (registration) => {
    try {
      setLoadingRegistration(registration._id)
      // Fetch full registration details including payment screenshot
      const response = await fetch(buildApiUrl(`/api/admin/registrations/${registration._id}`), {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSelectedRegistration(data.data)
          setShowVerificationModal(true)
        } else {
          setError('Failed to load registration details')
        }
      } else {
        setError('Failed to fetch registration details')
      }
    } catch (err) {
      console.error('Error fetching registration details:', err)
      setError('Error loading registration details')
    } finally {
      setLoadingRegistration('')
    }
  }

  const closeVerificationModal = () => {
    setSelectedRegistration(null)
    setShowVerificationModal(false)
  }

  const deleteRegistration = async (id) => {
    if (!confirm('Are you sure you want to delete this registration?')) {
      return
    }

    try {
      const response = await fetch(buildApiUrl(`/api/admin/registrations/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      const data = await response.json()
      if (data.success) {
        setRegistrations(prev => prev.filter(reg => reg._id !== id))
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Error deleting registration')
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters({
      ...filters,
      [name]: value,
      page: 1 // Reset to first page when filters change
    })
  }

  const handlePageChange = (newPage) => {
    setFilters({
      ...filters,
      page: newPage
    })
  }

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRegistrations()
    }, filters.search ? 500 : 0) // 500ms delay for search, immediate for other filters

    return () => clearTimeout(timeoutId)
  }, [filters])

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'verified':
        return 'bg-blue-100 text-blue-800'
      case 'paid_awaiting_verification':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid_awaiting_verification':
        return 'Awaiting Verification'
      case 'completed':
        return 'Completed'
      case 'verified':
        return 'Verified'
      case 'pending':
        return 'Payment Pending'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Manage Registrations</h1>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Name, email, or college..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                name="paymentStatus"
                value={filters.paymentStatus}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Payment Pending</option>
                <option value="paid_awaiting_verification">Awaiting Verification</option>
                <option value="verified">Verified</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
              <select
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Education
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-gray-200 rounded-full animate-pulse w-24 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Education
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.map((registration) => (
                    <tr key={registration._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {registration.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(registration.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{registration.email}</div>
                        <div className="text-sm text-gray-500">{registration.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{registration.college}</div>
                        <div className="text-sm text-gray-500">{registration.year}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(registration.paymentStatus)}`}>
                          {getStatusLabel(registration.paymentStatus)}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">
                          ₹{registration.amount / 100}
                        </div>
                        {registration.upiTransactionId && (
                          <div className="text-xs text-gray-400 font-mono mt-1">
                            UTR: {registration.upiTransactionId}
                          </div>
                        )}
                        {registration.paymentSubmittedAt && (
                          <div className="text-xs text-gray-400 mt-1">
                            Submitted: {new Date(registration.paymentSubmittedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-2">
                          {registration.paymentStatus === 'paid_awaiting_verification' && (
                            <button
                              onClick={() => openVerificationModal(registration)}
                              disabled={loadingRegistration === registration._id}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingRegistration === registration._id ? 'Loading...' : 'Verify Payment'}
                            </button>
                          )}
                          <select
                            value={registration.paymentStatus}
                            onChange={(e) => updatePaymentStatus(registration._id, e.target.value)}
                            disabled={updating === registration._id}
                            className="text-xs px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="pending">Payment Pending</option>
                            <option value="paid_awaiting_verification">Awaiting Verification</option>
                            <option value="verified">Verified</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                          </select>
                          <button
                            onClick={() => deleteRegistration(registration._id)}
                            className="text-red-600 hover:text-red-900 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.current - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.current * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm bg-blue-50 border border-blue-200 rounded text-blue-700">
                    {pagination.current} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.current + 1)}
                    disabled={pagination.current === pagination.pages}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Verification Modal */}
      <PaymentVerificationModal
        registration={selectedRegistration}
        isOpen={showVerificationModal}
        onClose={closeVerificationModal}
        onVerify={verifyPayment}
      />
    </div>
  )
}

export default AdminRegistrations