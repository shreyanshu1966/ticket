import { useState } from 'react'
import { config, buildApiUrl, API_ENDPOINTS } from './config.js'

function EventForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    year: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [registrationData, setRegistrationData] = useState(null)
  const [networkStatus, setNetworkStatus] = useState('checking')

  // Check network connectivity
  const checkNetworkStatus = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${config.API_BASE_URL}/api/health`, {
        signal: controller.signal,
        method: 'GET'
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        setNetworkStatus('online')
        return true
      } else {
        setNetworkStatus('offline')
        return false
      }
    } catch (error) {
      console.error('Network check failed:', error)
      setNetworkStatus('offline')
      return false
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field-specific validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
    
    // Clear general error
    if (error) {
      setError(null)
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) errors.name = 'Name is required'
    else if (formData.name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
    
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format'
    
    if (!formData.phone.trim()) errors.phone = 'Phone number is required'
    else if (!/^[+]?[\d\s\-\(\)]{10,15}$/.test(formData.phone)) errors.phone = 'Invalid phone number format'
    
    if (!formData.college.trim()) errors.college = 'College is required'
    else if (formData.college.trim().length < 2) errors.college = 'College name must be at least 2 characters'
    
    if (!formData.year) errors.year = 'Year is required'
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', college: '', year: '' })
    setError(null)
    setValidationErrors({})
    setPaymentStatus(null)
    setIsProcessing(false)
    setRegistrationData(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setError(null)
    setValidationErrors({})
    
    // First, check network connectivity
    const isOnline = await checkNetworkStatus()
    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.')
      return
    }
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setIsProcessing(true)
    setPaymentStatus('creating_order')
    
    try {
      // Create Razorpay order
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CREATE_ORDER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || 'Server error'}`)
      }

      const result = await response.json()

      if (!result.success) {
        // Handle validation errors from server
        if (result.errors && Array.isArray(result.errors)) {
          const serverErrors = {}
          result.errors.forEach(err => {
            if (err.path) serverErrors[err.path] = err.msg
          })
          setValidationErrors(serverErrors)
        }
        throw new Error(result.message || 'Failed to create order')
      }

      setPaymentStatus('opening_payment')

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error('Payment system is not available. Please refresh the page and ensure you have a stable internet connection.')
      }

      console.log('Initializing payment with Razorpay...')
      console.log('Order details:', { orderId: result.orderId, amount: result.amount })

      // Initialize Razorpay payment
      const options = {
        key: config.RAZORPAY_KEY_ID,
        amount: result.amount,
        currency: result.currency,
        name: 'Event Registration',
        description: 'Registration for our amazing event',
        order_id: result.orderId,
        timeout: 300, // 5 minutes timeout
        handler: async function (response) {
          setPaymentStatus('verifying_payment')
          
          // Payment successful, verify payment
          try {
            const verifyResponse = await fetch(buildApiUrl(API_ENDPOINTS.VERIFY_PAYMENT), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                registrationId: result.registrationId
              })
            })

            if (!verifyResponse.ok) {
              throw new Error(`HTTP ${verifyResponse.status}: Verification failed`)
            }

            const verifyResult = await verifyResponse.json()

            if (verifyResult.success) {
              console.log('Payment verified:', verifyResult.data)
              setRegistrationData(verifyResult.data)
              setPaymentStatus('completed')
              setIsSubmitted(true)
            } else {
              throw new Error(verifyResult.message || 'Payment verification failed')
            }
          } catch (verificationError) {
            console.error('Payment verification error:', verificationError)
            setPaymentStatus('verification_failed')
            setError(`Payment verification failed: ${verificationError.message}. Your payment may have been processed. Please contact support with payment ID: ${response.razorpay_payment_id}`)
          } finally {
            setIsProcessing(false)
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        notes: {
          college: formData.college,
          year: formData.year
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user')
            setPaymentStatus('cancelled')
            setIsProcessing(false)
            setError('Payment was cancelled. Please try again to complete your registration.')
          },
          escape: true,
          backdropclose: false
        }
      }

      const rzp = new window.Razorpay(options)
      
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error)
        setPaymentStatus('failed')
        setIsProcessing(false)
        
        let errorMessage = 'Payment failed. '
        
        // Handle specific Razorpay error codes
        switch(response.error.code) {
          case 'BAD_REQUEST_ERROR':
            errorMessage += 'Please check your payment details and try again.'
            break
          case 'GATEWAY_ERROR':
            errorMessage += 'Payment gateway error. Please try a different payment method.'
            break
          case 'NETWORK_ERROR':
            errorMessage += 'Network connectivity issue. Please check your internet connection and try again.'
            break
          case 'SERVER_ERROR':
            errorMessage += 'Payment service is temporarily unavailable. Please try again in a few minutes.'
            break
          case 'INVALID_REQUEST_ERROR':
            errorMessage += 'Invalid payment request. Please refresh the page and try again.'
            break
          default:
            errorMessage += response.error.description || 'Please try again or contact support.'
        }
        
        // Add additional context for common issues
        if (response.error.description && response.error.description.includes('network')) {
          errorMessage += ' If this persists, try using a different network or device.'
        }
        
        setError(errorMessage)
      })
      
      // Add error handling for opening payment modal
      try {
        rzp.open()
        console.log('Payment modal opened successfully')
      } catch (openError) {
        console.error('Failed to open payment modal:', openError)
        setPaymentStatus('failed')
        setIsProcessing(false)
        setError('Unable to open payment window. Please check if popups are blocked and try again.')
        return
      }

    } catch (error) {
      console.error('Registration error:', error)
      setIsProcessing(false)
      setPaymentStatus('error')
      
      // Handle different types of errors with more specific messages
      let errorMessage = error.message
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.'
      } else if (error.message.includes('NetworkError') || error.message.includes('ERR_NETWORK')) {
        errorMessage = 'Network connection problem. Please check your internet connection and try again.'
      } else if (error.message.includes('already registered')) {
        errorMessage = 'This email is already registered for the event. Please use a different email or contact support.'
      } else if (error.message.includes('Payment system')) {
        errorMessage = 'Payment service is currently unavailable. Please try again in a few minutes or contact support.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.'
      } else if (!errorMessage || errorMessage === 'Failed to fetch') {
        errorMessage = 'Registration failed. Please check your internet connection and try again.'
      }
      
      setError(errorMessage + ' If the problem persists, please contact our support team.')
    }
  }

  const isFormValid = formData.name.trim() && 
                      formData.email.trim() && 
                      formData.phone.trim() && 
                      formData.college.trim() && 
                      formData.year.trim() &&
                      Object.keys(validationErrors).length === 0

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">Thank you for registering for our event. We'll send confirmation details to your email.</p>
          
          {registrationData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-2">Registration Details:</h3>
              <p className="text-sm text-gray-600"><span className="font-medium">Name:</span> {registrationData.name}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Email:</span> {registrationData.email}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">College:</span> {registrationData.college}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Year:</span> {registrationData.year}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Amount Paid:</span> ₹{registrationData.amount}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Registration ID:</span> {registrationData.id}</p>
            </div>
          )}
          
          <button 
            onClick={() => {
              setIsSubmitted(false)
              resetForm()
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Register Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎪 ACD 2025 Registration</h1>
          <p className="text-gray-600">January 29-30, 2026 • Join us for an amazing experience!</p>
          <p className="text-lg font-semibold text-blue-600 mt-2">Registration Fee: ₹199</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Network Status Indicator */}
          {networkStatus === 'offline' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <div>
                  <h4 className="text-yellow-800 font-medium text-sm">Connection Issue</h4>
                  <p className="text-yellow-700 text-sm mt-1">
                    Having trouble connecting to our servers. Please check your internet connection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h4 className="text-red-800 font-medium text-sm">Error</h4>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Payment Status Display */}
          {paymentStatus && paymentStatus !== 'completed' && paymentStatus !== 'error' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-3"></div>
                <div>
                  <p className="text-blue-800 text-sm font-medium">
                    {paymentStatus === 'creating_order' && 'Creating payment order...'}
                    {paymentStatus === 'opening_payment' && 'Opening payment gateway...'}
                    {paymentStatus === 'verifying_payment' && 'Verifying payment...'}
                    {paymentStatus === 'cancelled' && 'Payment cancelled'}
                    {paymentStatus === 'failed' && 'Payment failed'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none ${
                validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {validationErrors.name && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none ${
                validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
            />
            {validationErrors.email && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none ${
                validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your phone number"
            />
            {validationErrors.phone && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.phone}</p>
            )}
          </div>

          {/* College Field */}
          <div>
            <label htmlFor="college" className="block text-sm font-medium text-gray-700 mb-2">
              College/University *
            </label>
            <input
              type="text"
              id="college"
              name="college"
              value={formData.college}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none ${
                validationErrors.college ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your college/university name"
            />
            {validationErrors.college && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.college}</p>
            )}
          </div>

          {/* Year Field */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              Year/Level *
            </label>
            <select
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none bg-white ${
                validationErrors.year ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select your year/level</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="Graduate">Graduate</option>
              <option value="Post Graduate">Post Graduate</option>
            </select>
            {validationErrors.year && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.year}</p>
            )}
          </div>

          {/* Price Display */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Event Price:</span>
              <span className="text-2xl font-bold text-green-600">₹199</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">One-time registration fee</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isProcessing}
            className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 flex items-center justify-center ${
              isFormValid && !isProcessing
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                {paymentStatus === 'creating_order' && 'Creating Order...'}
                {paymentStatus === 'opening_payment' && 'Opening Payment...'}
                {paymentStatus === 'verifying_payment' && 'Verifying Payment...'}
                {!paymentStatus && 'Processing...'}
              </>
            ) : (
              'Pay ₹199 & Register'
            )}
          </button>
          
          {/* Retry Button for Failed Payments */}
          {(paymentStatus === 'failed' || paymentStatus === 'cancelled' || paymentStatus === 'verification_failed') && (
            <button
              type="button"
              onClick={() => {
                setPaymentStatus(null)
                setError(null)
                handleSubmit({ preventDefault: () => {} })
              }}
              className="w-full py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition duration-200"
            >
              Retry Payment
            </button>
          )}
        </form>

        {/* Troubleshooting Section */}
        {(error && error.includes('Payment') || paymentStatus === 'failed') && (
          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <h4 className="text-gray-800 font-medium text-sm mb-2">💡 Payment Troubleshooting</h4>
            <ul className="text-gray-600 text-xs space-y-1">
              <li>• Ensure your internet connection is stable</li>
              <li>• Try refreshing the page and attempting payment again</li>
              <li>• Check if popup blockers are disabled</li>
              <li>• Try using a different payment method (card/UPI/netbanking)</li>
              <li>• Clear browser cache and cookies if issues persist</li>
              <li>• Contact support if the problem continues</li>
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">
          By registering, you agree to our terms and conditions.
        </p>
      </div>
    </div>
  )
}

export default EventForm