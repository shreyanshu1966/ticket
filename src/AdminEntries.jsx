import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildApiUrl } from './config'

const AdminEntries = () => {
  const [entries, setEntries] = useState([])
  const [dailyStats, setDailyStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [hourlyStats, setHourlyStats] = useState([])
  const [exporting, setExporting] = useState(false)
  const navigate = useNavigate()

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchEntries = async (page = 1, day = '', search = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      })
      
      if (day) params.append('day', day)
      if (search) params.append('search', search)

      const endpoint = day 
        ? `/api/admin/entries/day/${day}?${params.toString()}`
        : `/api/admin/entries?${params.toString()}`

      const response = await fetch(buildApiUrl(endpoint), {
        headers: getAuthHeaders()
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }

      const data = await response.json()
      if (data.success) {
        setEntries(data.data.entries)
        if (data.data.dailyStats) {
          setDailyStats(data.data.dailyStats)
        }
        if (data.data.hourlyStats) {
          setHourlyStats(data.data.hourlyStats)
        }
        setTotalPages(data.data.pagination.total)
        setCurrentPage(data.data.pagination.current)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Error fetching entries data')
      console.error('Fetch entries error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDayFilter = (day) => {
    setSelectedDay(day)
    setCurrentPage(1)
    setSearchTerm('')
    fetchEntries(1, day, '')
  }

  const handleSearch = (search) => {
    setSearchTerm(search)
    setCurrentPage(1)
    fetchEntries(1, selectedDay, search)
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const params = new URLSearchParams()
      if (selectedDay) params.append('day', selectedDay)

      const response = await fetch(buildApiUrl(`/api/admin/export/entries?${params.toString()}`), {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const dayLabel = selectedDay ? `_day${selectedDay}` : '_all'
        a.download = `event_entries${dayLabel}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError('Failed to export entries')
      }
    } catch (err) {
      setError('Error exporting entries')
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  if (loading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading entries data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Entries</h1>
              <p className="mt-2 text-gray-600">
                View and manage event entries by day
              </p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Daily Stats Overview */}
        {dailyStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Entries
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dailyStats.reduce((sum, day) => sum + day.totalEntries, 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {dailyStats.map((day) => (
              <div key={day.day} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 ${day.day === 1 ? 'bg-green-500' : 'bg-purple-500'} rounded-md flex items-center justify-center`}>
                        <span className="text-white font-bold">{day.day}</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Day {day.day} Entries
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {day.totalEntries}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDayFilter('')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedDay === '' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Days
              </button>
              <button
                onClick={() => handleDayFilter('1')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedDay === '1' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Day 1
              </button>
              <button
                onClick={() => handleDayFilter('2')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedDay === '2' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Day 2
              </button>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search name, email, ticket..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 sm:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleExport}
                disabled={exporting}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {exporting ? '...' : '📥 Export'}
              </button>
            </div>
          </div>
        </div>

        {/* Hourly Stats for Selected Day */}
        {selectedDay && hourlyStats.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Day {selectedDay} - Hourly Entry Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {Array.from({length: 24}, (_, hour) => {
                const hourData = hourlyStats.find(h => h._id === hour)
                const count = hourData ? hourData.count : 0
                return (
                  <div key={hour} className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-500">{hour}:00</div>
                    <div className="text-sm font-semibold text-gray-900">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Entries Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Entry Records
                {selectedDay && ` - Day ${selectedDay}`}
              </h3>
              <span className="text-sm text-gray-500">
                Showing {entries.length} entries
              </span>
            </div>
          </div>

          {entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entry Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {entry.attendeeName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.attendeeEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {entry.ticketNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {entry.attendeeCollege || entry.registrationId?.college || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.attendeeYear || entry.registrationId?.year || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.day === 1 ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          Day {entry.day}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(entry.entryDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(entry.entryDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.isGroupMember 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.isGroupMember ? 'Group Member' : 'Individual'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">🎪</div>
                <h3 className="text-lg font-medium text-gray-900">No entries found</h3>
                <p className="mt-2">
                  {searchTerm 
                    ? `No entries match your search "${searchTerm}"`
                    : selectedDay 
                      ? `No entries recorded for Day ${selectedDay}`
                      : 'No entries have been recorded yet'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchEntries(currentPage - 1, selectedDay, searchTerm)}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchEntries(currentPage + 1, selectedDay, searchTerm)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminEntries