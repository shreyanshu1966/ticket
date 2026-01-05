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
      subject: 'Event Reminder - ACD 2025',
      message: 'Hi {name},\n\nThis is a friendly reminder about the upcoming ACD 2025 event. We\'re excited to see you there!\n\nEvent Details:\n- Date: [Event Date]\n- Time: [Event Time]\n- Venue: [Event Venue]\n\nPlease bring a valid ID and your registration confirmation.\n\nBest regards,\nACD 2025 Team',
      targetGroup: 'completed'
    },
    {
      subject: 'Payment Pending - Complete Your Registration',
      message: 'Hi {name},\n\nWe noticed that your payment for ACD 2025 is still pending. Please complete your payment to secure your spot at the event.\n\nPayment Amount: ₹199\n\nIf you\'ve already made the payment, please ignore this message.\n\nBest regards,\nACD 2025 Team',
      targetGroup: 'pending'
    },
    {
      subject: 'Important Update - ACD 2025 Event',
      message: 'Hi {name},\n\nWe have an important update regarding the ACD 2025 event.\n\n[Your update message here]\n\nFor any questions, please contact us at [contact email].\n\nBest regards,\nACD 2025 Team',
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