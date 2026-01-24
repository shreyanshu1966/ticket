import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildApiUrl } from './config'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [friendOffer, setFriendOffer] = useState(null)
  const [updatingOffer, setUpdatingOffer] = useState(false)
  const navigate = useNavigate()

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/admin/dashboard/stats'), {
        headers: getAuthHeaders()
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }

      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Error fetching dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchFriendOfferSettings = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/admin/friend-offer'), {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setFriendOffer(data.data)
        }
      }
    } catch (err) {
      console.error('Error fetching friend offer settings:', err)
    }
  }

  const toggleFriendOffer = async () => {
    if (!friendOffer) return

    setUpdatingOffer(true)
    try {
      const response = await fetch(buildApiUrl('/api/admin/friend-offer/toggle'), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          enabled: !friendOffer.enabled,
          adminName: 'Admin User'
        })
      })

      const data = await response.json()
      if (data.success) {
        setFriendOffer(prev => ({ ...prev, enabled: data.data.enabled }))
      } else {
        setError('Failed to update friend offer setting')
      }
    } catch (err) {
      setError('Error updating friend offer setting')
    } finally {
      setUpdatingOffer(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  useEffect(() => {
    fetchStats()
    fetchFriendOfferSettings()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Registrations
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalRegistrations || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">🎫</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Tickets
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalTickets || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">👨‍👩‍👧‍👦</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Group Bookings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.groupBookings || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed Payments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.completedPayments || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Payments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.pendingPayments || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ₹{stats?.totalRevenue || 0}
                    </dd>
                    {stats?.totalSavings > 0 && (
                      <dd className="text-xs text-green-600">
                        ₹{stats?.totalSavings || 0} saved via offers
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Entry Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">🎉</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Entries Confirmed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalEntriesConfirmed || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">⏰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Awaiting Verification
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.awaitingVerification || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">📱</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Scanned
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalScanned || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Year Statistics */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Registrations by Year
              </h3>
              <div className="space-y-3">
                {stats?.yearStats?.map((yearStat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{yearStat._id}</span>
                    <span className="text-sm font-medium text-gray-900">{yearStat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Registrations */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Registrations
              </h3>
              <div className="space-y-3">
                {stats?.recentRegistrations?.slice(0, 5).map((registration, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{registration.name}</p>
                      <p className="text-xs text-gray-500">{registration.college}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${registration.paymentStatus === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : registration.paymentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                        {registration.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/registrations')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-center font-medium transition-colors"
          >
            Manage Registrations
          </button>
          <button
            onClick={() => navigate('/admin/export')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-center font-medium transition-colors"
          >
            Export Data
          </button>
          <button
            onClick={() => navigate('/admin/notifications')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-center font-medium transition-colors"
          >
            Send Notifications
          </button>
        </div>

        {/* Friend Offer Settings */}
        {friendOffer && (
          <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                🎉 Friend Offer Settings
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Control the "Bring Your Friend" offer availability
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-3">
                      Friend Offer Status
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      friendOffer.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {friendOffer.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Friends get ₹{friendOffer.topUpDisplay || '100'} off (Pay ₹99 instead of ₹199)
                  </p>
                  {friendOffer.statistics && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="mr-4">Total: {friendOffer.statistics.totalFriendReferrals}</span>
                      <span className="mr-4">Completed: {friendOffer.statistics.completedFriendPayments}</span>
                      <span>Pending: {friendOffer.statistics.pendingFriendPayments}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={toggleFriendOffer}
                  disabled={updatingOffer}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    friendOffer.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  } ${updatingOffer ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                      friendOffer.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard