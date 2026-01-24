import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildApiUrl } from './config'

const AdminNotifications = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notification, setNotification] = useState({
    subject: '',
    message: '',
    targetGroup: 'all'
  })
  const navigate = useNavigate()

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const handleSendNotification = async (e) => {
    e.preventDefault()

    if (!notification.subject.trim() || !notification.message.trim()) {
      setError('Subject and message are required')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(buildApiUrl('/api/admin/notifications/bulk'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(notification)
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }

      const data = await response.json()
      if (data.success) {
        setSuccess(`${data.message}`)
        if (data.data.failed > 0) {
          setError(`Note: ${data.data.failed} emails failed to send. Check server logs for details.`)
        }
        setNotification({ subject: '', message: '', targetGroup: 'all' })
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Error sending notification')
    } finally {
      setLoading(false)
    }
  }

  const handleSendTimingCorrection = async (targetGroup = 'all') => {
    if (!confirm(`Are you sure you want to send timing correction emails to ${targetGroup === 'all' ? 'ALL registered users' : targetGroup + ' users'}? This will notify them about the corrected event timing.`)) {
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(buildApiUrl('/api/admin/notifications/timing-correction'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ targetGroup })
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }

      const data = await response.json()
      if (data.success) {
        setSuccess(`✅ ${data.message} - Timing correction emails sent successfully!`)
        if (data.data.failed > 0) {
          setError(`Note: ${data.data.failed} emails failed to send. Check server logs for details.`)
        }
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Error sending timing correction emails')
    } finally {
      setLoading(false)
    }
  }

  const handleSendBringFriendPromotion = async (targetGroup = 'completed') => {
    if (!confirm(`Are you sure you want to send "Bring Your Friend" promotional emails to ${targetGroup === 'completed' ? 'ALL registered users' : targetGroup + ' users'}? This will promote the friend referral offer.`)) {
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(buildApiUrl('/api/admin/notifications/bring-friend-promotion'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ targetGroup })
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }

      const data = await response.json()
      if (data.success) {
        setSuccess(`✅ ${data.message} - Bring friend promotion emails sent successfully!`)
        if (data.data.failed > 0) {
          setError(`Note: ${data.data.failed} emails failed to send. Check server logs for details.`)
        }
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Error sending bring friend promotion emails')
    } finally {
      setLoading(false)
    }
  }

  const handleResendTickets = async (targetGroup = 'completed') => {
    if (!confirm(`Are you sure you want to resend tickets to ${targetGroup === 'completed' ? 'ALL users with completed payments' : targetGroup + ' users'}? This will send registration confirmation and ticket emails.`)) {
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(buildApiUrl('/api/admin/notifications/resend-tickets'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ targetGroup })
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }

      const data = await response.json()
      if (data.success) {
        setSuccess(`✅ ${data.message} - Tickets resent successfully!`)
        if (data.data.failed > 0) {
          setError(`Note: ${data.data.failed} emails failed to send. Check server logs for details.`)
        }
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Error resending tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setNotification({
      ...notification,
      [e.target.name]: e.target.value
    })
  }

  const getGroupDescription = (group) => {
    switch (group) {
      case 'all':
        return 'All registered users'
      case 'completed':
        return 'Users with completed payments'
      case 'pending':
        return 'Users with pending payments'
      case 'failed':
        return 'Users with failed payments'
      default:
        return ''
    }
  }

  const presetMessages = [
    {
      subject: 'Event Reminder - ACD 2026',
      message: 'Hi {name},\n\nThis is a friendly reminder about the upcoming ACD 2026 event. We\'re excited to see you there!\n\nEvent Details:\n- Date: [Event Date]\n- Time: [Event Time]\n- Venue: [Event Venue]\n\nPlease bring a valid ID and your registration confirmation.\n\nBest regards,\nACD 2026 Team',
      targetGroup: 'completed'
    },
    {
      subject: 'Payment Pending - Complete Your Registration',
      message: 'Hi {name},\n\nWe noticed that your payment for ACD 2026 is still pending. Please complete your payment to secure your spot at the event.\n\nPayment Amount: ₹199\n\nIf you\'ve already made the payment, please ignore this message.\n\nBest regards,\nACD 2026 Team',
      targetGroup: 'pending'
    },
    {
      subject: 'Important Update - ACD 2026 Event',
      message: 'Hi {name},\n\nWe have an important update regarding the ACD 2026 event.\n\n[Your update message here]\n\nFor any questions, please contact us at [contact email].\n\nBest regards,\nACD 2026 Team',
      targetGroup: 'all'
    }
  ]

  const loadPreset = (preset) => {
    setNotification(preset)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Send Notifications</h1>
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

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
            <button onClick={() => setSuccess('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Timing Correction Section */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                ⏰ Event Timing Correction
              </h3>
              <p className="text-sm text-yellow-800 mb-4">
                Send correction emails to users who received emails with incorrect event timing.
                The email will clearly show the corrected timing: <strong>8:00 AM - 5:00 PM</strong> (was incorrectly shown as 8:00 PM - 5:00 PM).
              </p>

              <div className="bg-white bg-opacity-60 rounded-md p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Email will include:</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>✓ Clear comparison of incorrect vs correct timing</li>
                  <li>✓ Full event details with corrected timing highlighted</li>
                  <li>✓ Professional apology message</li>
                  <li>✓ Contact information for support</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleSendTimingCorrection('all')}
                  disabled={loading}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-6 py-2.5 rounded-md font-medium transition-colors shadow-md flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send to All Users
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleSendTimingCorrection('completed')}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2.5 rounded-md font-medium transition-colors shadow-md text-sm"
                >
                  Completed Only
                </button>

                <button
                  onClick={() => handleSendTimingCorrection('pending')}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-2.5 rounded-md font-medium transition-colors shadow-md text-sm"
                >
                  Pending Only
                </button>
              </div>

              <p className="text-xs text-yellow-700 mt-3 italic">
                💡 Tip: Test with a small group first before sending to all users
              </p>
            </div>
          </div>
        </div>

        {/* Bring Friend Offer Promotion Section */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-400 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-bold text-purple-900 mb-2">
                🎁 Bring Friend Offer Promotion
              </h3>
              <p className="text-sm text-purple-800 mb-4">
                Send promotional emails to registered users encouraging them to bring their friends.
                Friends can register for only <strong>₹99</strong> (saving ₹100 from the regular ₹199 price).
              </p>

              <div className="bg-white bg-opacity-60 rounded-md p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Email includes:</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>✓ Exclusive ₹100 discount offer for friends</li>
                  <li>✓ Step-by-step guide on how to refer friends</li>
                  <li>✓ Event benefits and highlights</li>
                  <li>✓ Beautiful, engaging design with clear call-to-action</li>
                  <li>✓ Terms and conditions of the offer</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-md p-3 mb-4 border border-purple-200">
                <p className="text-xs text-purple-900 font-medium mb-1">📊 Eligibility Criteria (Same as Bring Friend Form):</p>
                <ul className="text-xs text-purple-800 space-y-1 ml-4">
                  <li>✅ Payment status must be "completed"</li>
                  <li>✅ Individual bookings only (NOT group bookings)</li>
                  <li>✅ Not a friend referral themselves</li>
                  <li>✅ Has NOT already referred a friend</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleSendBringFriendPromotion('completed')}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-2.5 rounded-md font-medium transition-colors shadow-md flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Send to All Eligible Users
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-purple-700 mt-3 italic">
                💡 Tip: Only individual booking users who haven't referred yet are eligible (matches bring friend form rules)
              </p>
            </div>
          </div>
        </div>

        {/* Resend Tickets Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                🎫 Resend Tickets
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                Resend registration confirmation and ticket emails to users who have completed payment.
                Useful if original emails were lost or had delivery issues.
              </p>

              <div className="bg-white bg-opacity-60 rounded-md p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Each user will receive:</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>✓ Registration confirmation email</li>
                  <li>✓ E-Ticket with QR code</li>
                  <li>✓ Event details and venue information</li>
                  <li>✓ Contact information for support</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleResendTickets('completed')}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-md font-medium transition-colors shadow-md flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      Resend to All Completed
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleResendTickets('ticket_sent')}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2.5 rounded-md font-medium transition-colors shadow-md text-sm"
                >
                  Already Sent Only
                </button>

                <button
                  onClick={() => handleResendTickets('no_ticket')}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-2.5 rounded-md font-medium transition-colors shadow-md text-sm"
                >
                  Not Sent Only
                </button>
              </div>

              <p className="text-xs text-blue-700 mt-3 italic">
                💡 Tip: Use "Not Sent Only" to send tickets to users who haven't received them yet
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Compose Notification</h2>

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Group
                  </label>
                  <select
                    name="targetGroup"
                    value={notification.targetGroup}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Users</option>
                    <option value="completed">Completed Payments</option>
                    <option value="pending">Pending Payments</option>
                    <option value="failed">Failed Payments</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    {getGroupDescription(notification.targetGroup)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={notification.subject}
                    onChange={handleInputChange}
                    placeholder="Enter email subject..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={notification.message}
                    onChange={handleInputChange}
                    placeholder="Enter your message here..."
                    rows="8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    You can use {'{name}'} as a placeholder for the recipient's name.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      '📧 Send Notification'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Preset Templates */}
          <div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Templates</h3>

              <div className="space-y-3">
                {presetMessages.map((preset, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3">
                    <h4 className="font-medium text-sm text-gray-900 mb-1">
                      {preset.subject}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">
                      Target: {getGroupDescription(preset.targetGroup)}
                    </p>
                    <button
                      type="button"
                      onClick={() => loadPreset(preset)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Guidelines</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Keep subject lines clear and concise</li>
                <li>• Personalize messages when possible</li>
                <li>• Include relevant event information</li>
                <li>• Provide contact details for support</li>
                <li>• Test with a small group first</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Email Notifications Active
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Emails will be sent to users based on their registration status.
                  Please ensure your email configuration is properly set up in the backend environment variables.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminNotifications
