import { useState, useEffect } from 'react'
import { config, buildApiUrl, API_ENDPOINTS } from './config.js'
import PaymentForm from './PaymentForm.jsx'
import PaymentSuccess from './PaymentSuccess.jsx'

function EventForm() {
  // Registration status - set to true to close registrations
  const isRegistrationClosed = true

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    year: ''
  })
  // Individual booking only - no group functionality
  const ticketQuantity = 1
  const isGroupBooking = false
  const groupMembers = []
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [registrationData, setRegistrationData] = useState(null)

  // Option 3: Smart form detection states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [pendingRegistration, setPendingRegistration] = useState(null)
  const [emailCheckTimeout, setEmailCheckTimeout] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear field-specific validation error by removing it from the object
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    // Clear general error
    if (error) {
      setError(null)
    }

    // Option 3: Check email for pending payments (debounced)
    if (name === 'email' && value.trim()) {
      // Clear pending registration when email changes
      setPendingRegistration(null)

      // Clear previous timeout
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }

      // Set new timeout for email check (500ms debounce)
      const timeout = setTimeout(() => {
        checkEmailForPendingPayment(value.trim())
      }, 500)

      setEmailCheckTimeout(timeout)
    }
  }

  // Fixed price for individual ticket
  const calculatePrice = () => {
    return 199
  }

  // Option 3: Check if email has pending payment
  const checkEmailForPendingPayment = async (email) => {
    // Basic email validation before checking
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return
    }

    setIsCheckingEmail(true)

    try {
      const response = await fetch(buildApiUrl(`/api/registrations/check-email?email=${encodeURIComponent(email)}`))
      const result = await response.json()

      if (result.success && result.exists && result.hasPendingPayment) {
        setPendingRegistration(result.data)
      } else {
        setPendingRegistration(null)
      }
    } catch (err) {
      console.error('Error checking email:', err)
      // Silently fail - don't disrupt user experience
    } finally {
      setIsCheckingEmail(false)
    }
  }

  // Option 3: Handle resume payment
  const handleResumePayment = () => {
    if (pendingRegistration) {
      setRegistrationData(pendingRegistration)
      setShowPayment(true)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) errors.name = 'Name is required'
    else if (formData.name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
    else if (!/^[a-zA-Z\s.'-]+$/.test(formData.name.trim())) errors.name = 'Name contains invalid characters'

    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Please enter a valid email address'

    if (!formData.phone.trim()) errors.phone = 'Phone number is required'
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) errors.phone = 'Please enter a valid 10-digit phone number'

    if (!formData.college.trim()) errors.college = 'College name is required'
    else if (formData.college.trim().length < 3) errors.college = 'College name must be at least 3 characters'

    if (!formData.year.trim()) errors.year = 'Academic year is required'

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      college: '',
      year: ''
    })
  }
  // Individual booking only - no group states to reset
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Clear previous errors
    setError(null)
    setValidationErrors({})

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    try {
      console.log('Submitting registration...', formData)

      // Create registration (pending payment) - individual booking only
      const registrationPayload = {
        ...formData,
        paymentStatus: 'pending',
        isGroupBooking: false,
        ticketQuantity: 1,
        totalAmount: calculatePrice() * 100, // Convert to paise
        groupMembers: []
      }

      const response = await fetch(buildApiUrl('/api/registrations/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationPayload)
      })

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
        throw new Error(result.message || 'Failed to create registration')
      }

      console.log('✅ Registration created successfully:', result.data)
      setRegistrationData(result.data)
      setShowPayment(true)

    } catch (error) {
      console.error('Registration error:', error)
      setIsProcessing(false)

      let errorMessage = error.message || 'An unexpected error occurred'

      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.'
      } else if (error.message.includes('already registered')) {
        errorMessage = 'This email is already registered for the event.'
      }

      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentComplete = (updatedData) => {
    setRegistrationData(updatedData)
    setPaymentComplete(true)
    setShowPayment(false)
  }

  const isFormValid = () => {
    const basicFormValid = formData.name.trim() &&
      formData.email.trim() &&
      formData.phone.trim() &&
      formData.college.trim() &&
      formData.year.trim()

    return basicFormValid && Object.keys(validationErrors).length === 0
  }

  // Show registration closed message if registrations are closed
  if (isRegistrationClosed) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black px-4">
        <div className="w-full max-w-lg bg-[#1a1a1a] rounded-2xl p-8 border border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Registrations Closed
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              Thank you for your interest! Registration for this event has been closed.
            </p>
            <div className="bg-[#262626] border border-gray-600 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-400 mb-3 text-center">
                📞 For Any Queries, Contact:
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Aayush:</span>
                  <a href="tel:+919226750350" className="text-white hover:text-purple-400 transition-colors">
                    9226750350
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Ishan:</span>
                  <a href="tel:+919552448038" className="text-white hover:text-purple-400 transition-colors">
                    9552448038
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showPayment) {
    return <PaymentForm
      registrationData={registrationData}
      onPaymentComplete={handlePaymentComplete}
    />
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black px-4">
        <div className="w-full max-w-lg bg-[#1a1a1a] rounded-2xl p-8 border border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Registration Successful!
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              Thank you for registering. Check your email for confirmation.
            </p>

            {registrationData && (
              <div className="bg-[#262626] rounded-lg p-4 mb-6 text-left border border-gray-600">
                <h3 className="font-semibold text-purple-400 mb-3 text-sm">
                  Registration Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name</span>
                    <span className="text-white">{registrationData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email</span>
                    <span className="text-white">{registrationData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">College</span>
                    <span className="text-white">{registrationData.college}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Year</span>
                    <span className="text-white">{registrationData.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Registration ID</span>
                    <span className="text-purple-400 font-mono text-xs">{registrationData.id}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setIsSubmitted(false)
                resetForm()
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-full text-base font-semibold transition-colors"
            >
              Register Another Person
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-black px-4">
      <div className="w-full max-w-lg">
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-700">
          <div className="text-center mb-6">
            <img
              src="/form.png"
              alt="Event Registration"
              className="mx-auto mb-4 max-w-full h-auto rounded-lg"
            />
            <h1 className="text-2xl font-bold text-white mb-2">Event Registration</h1>
            <p className="text-gray-400 text-sm">Join our amazing event</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-950 border border-red-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-300">Registration Error</h3>
                  <div className="text-sm text-red-200 mt-1">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Individual Ticket Only */}
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg border border-purple-600">
              <div className="flex justify-between items-center">
                <span className="text-white text-lg font-semibold">Event Ticket</span>
                <span className="text-2xl font-bold text-white">₹199</span>
              </div>
              <p className="text-purple-200 text-sm mt-1">Individual registration - one ticket per person</p>
            </div>

            {/* Primary Member Details */}
            <div className="border-t border-gray-600 pt-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Your Details
              </h3>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-[#262626] border ${validationErrors.name ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors`}
                  placeholder="Enter your full name"
                  disabled={isProcessing}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 bg-[#262626] border ${validationErrors.email ? 'border-red-500' : pendingRegistration ? 'border-yellow-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors`}
                    placeholder="Enter your email address"
                    disabled={isProcessing}
                  />
                  {isCheckingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                    </div>
                  )}
                </div>
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
                )}

                {/* Option 3: Pending Payment Detection */}
                {pendingRegistration && !validationErrors.email && (
                  <div className="mt-3 bg-yellow-950 border border-yellow-800 rounded-lg p-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-yellow-300">Pending Payment Found</h3>
                        <p className="text-xs text-yellow-200 mt-1">
                          You have a pending registration. Complete your payment to secure your spot!
                        </p>
                        <button
                          type="button"
                          onClick={handleResumePayment}
                          className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors w-full"
                        >
                          Resume Payment - ₹{pendingRegistration.amount / 100}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-[#262626] border ${validationErrors.phone ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors`}
                  placeholder="Enter your 10-digit phone number"
                  disabled={isProcessing}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="college" className="block text-sm font-medium text-gray-300 mb-1">
                  College/University *
                </label>
                <input
                  type="text"
                  id="college"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-[#262626] border ${validationErrors.college ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors`}
                  placeholder="Enter your college or university name"
                  disabled={isProcessing}
                />
                {validationErrors.college && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.college}</p>
                )}
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-1">
                  Academic Year *
                </label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-[#262626] border ${validationErrors.year ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors`}
                  disabled={isProcessing}
                >
                  <option value="">Select your academic year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="PhD">PhD</option>
                  <option value="Alumni">Alumni</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Other">Other</option>
                </select>
                {validationErrors.year && (
                  <p className="mt-1 text-sm text-red-400">{validationErrors.year}</p>
                )}
              </div>
            </div>


          </div>

          <button
            type="submit"
            disabled={isProcessing || !isFormValid()}
            className={`w-full mt-6 py-3 rounded-full text-base font-semibold transition-all duration-300 ${isProcessing || !isFormValid()
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `Continue to Payment - ₹${calculatePrice()}`
            )}
          </button>

          <div className="mt-6 bg-[#262626] border border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-purple-400 mb-3 text-center">
              📞 For Queries, Contact:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Aayush:</span>
                <a href="tel:+919226750350" className="text-white hover:text-purple-400 transition-colors">
                  9226750350
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Ishan:</span>
                <a href="tel:+919552448038" className="text-white hover:text-purple-400 transition-colors">
                  9552448038
                </a>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Your registration data is safe and secure with us.
          </p>
        </form>
      </div>
    </div>
  )
}

export default EventForm