import { useState, useEffect, useRef } from 'react'
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
  const [razorpayStatus, setRazorpayStatus] = useState('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  
  const abortControllerRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  
  // Configuration constants
  const MAX_RETRY_ATTEMPTS = parseInt(import.meta.env.VITE_RETRY_ATTEMPTS) || 3
  const RETRY_DELAY = parseInt(import.meta.env.VITE_RETRY_DELAY) || 2000
  const NETWORK_TIMEOUT = parseInt(import.meta.env.VITE_NETWORK_TIMEOUT) || 10000

  // Enhanced network connectivity check with retries
  const checkNetworkStatus = async (retryAttempt = 0) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT)
      
      const response = await fetch(`${config.API_BASE_URL}/api/health`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        setNetworkStatus('online')
        return true
      } else {
        throw new Error(`Network check failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error(`Network check failed (attempt ${retryAttempt + 1}):`, error)
      
      if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
        console.log(`Retrying network check in ${RETRY_DELAY}ms...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryAttempt + 1)))
        return await checkNetworkStatus(retryAttempt + 1)
      }
      
      setNetworkStatus('offline')
      return false
    }
  }

  // Check and ensure Razorpay is loaded
  const checkRazorpayStatus = async (retryAttempt = 0) => {
    try {
      // Check if Razorpay failed to load completely
      if (window.razorpayLoadFailed) {
        setRazorpayStatus('failed')
        return false
      }
      
      if (typeof window.Razorpay !== 'undefined') {
        setRazorpayStatus('loaded')
        if (retryAttempt > 0) {
          console.log('✅ Razorpay loaded successfully after retry')
        }
        return true
      }
      
      // Wait a bit for the script to load
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (typeof window.Razorpay !== 'undefined') {
        setRazorpayStatus('loaded')
        console.log('✅ Razorpay loaded successfully')
        return true
      }
      
      throw new Error('Razorpay not loaded')
    } catch (error) {
      if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
        console.log(`🔄 Retrying Razorpay check (attempt ${retryAttempt + 2})...`)
        setRazorpayStatus('retrying')
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return await checkRazorpayStatus(retryAttempt + 1)
      }
      
      console.error('❌ Razorpay loading failed after all retries')
      setRazorpayStatus('failed')
      return false
    }
  }

  // Initialize systems on component mount
  useEffect(() => {
    const initializeSystems = async () => {
      // Check network first
      const isOnline = await checkNetworkStatus()
      
      // Check Razorpay loading
      await checkRazorpayStatus()
      
      if (!isOnline) {
        setError('Unable to connect to the server. Please check your internet connection and refresh the page.')
      }
    }
    
    // Add network status listeners
    const handleOnline = () => {
      console.log('Network connection restored')
      setNetworkStatus('online')
      if (error && error.includes('internet connection')) {
        setError(null)
      }
    }
    
    const handleOffline = () => {
      console.log('Network connection lost')
      setNetworkStatus('offline')
      setError('Internet connection lost. Please check your connection.')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    initializeSystems()
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Robust fetch with retry logic
  const robustFetch = async (url, options = {}, retryAttempt = 0) => {
    try {
      // Create new AbortController for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()
      
      const timeoutId = setTimeout(() => {
        abortControllerRef.current.abort()
      }, NETWORK_TIMEOUT)
      
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.')
      }
      
      if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
        console.log(`Request failed (attempt ${retryAttempt + 1}), retrying in ${RETRY_DELAY * (retryAttempt + 1)}ms...`)
        setIsRetrying(true)
        
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, RETRY_DELAY * (retryAttempt + 1))
        })
        
        setIsRetrying(false)
        return await robustFetch(url, options, retryAttempt + 1)
      }
      
      throw error
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
    setValidationErrors({})
    setError(null)
    setPaymentStatus(null)
    setRegistrationData(null)
    setRetryCount(0)
  }

  // Check payment status with retry mechanism
  const checkPaymentStatus = async (paymentId, registrationId, retryAttempt = 0) => {
    try {
      console.log(`🔍 Checking payment status (attempt ${retryAttempt + 1})...`)
      
      const statusResult = await robustFetch(buildApiUrl(API_ENDPOINTS.CHECK_VERIFICATION), {
        method: 'POST',
        body: JSON.stringify({
          paymentId,
          registrationId
        })
      })
      
      if (statusResult.success) {
        const data = statusResult.data
        console.log('✅ Payment status check result:', data)
        
        if (data.paymentStatus === 'completed') {
          setRegistrationData(data)
          setPaymentStatus('completed')
          setIsSubmitted(true)
          
          // Show success message based on ticket generation status
          setTimeout(() => {
            if (data.ticketGenerated && data.emailSent) {
              alert('🎉 Payment was successful! Check your email for the ticket.')
            } else if (data.paymentStatus === 'completed') {
              alert('🎉 Payment was successful! Your ticket will be emailed shortly. If you don\'t receive it within a few minutes, please contact support with payment ID: ' + paymentId)
            }
          }, 500)
          
          return true
        } else if (data.paymentStatus === 'pending' && retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
          // Payment might still be processing, retry
          console.log('⏳ Payment still pending, retrying...')
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryAttempt + 1)))
          return await checkPaymentStatus(paymentId, registrationId, retryAttempt + 1)
        } else {
          throw new Error(`Payment status: ${data.paymentStatus}`)
        }
      } else {
        throw new Error(statusResult.message || 'Failed to check payment status')
      }
    } catch (error) {
      if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
        console.log(`⏳ Status check failed, retrying in ${RETRY_DELAY * (retryAttempt + 1)}ms...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryAttempt + 1)))
        return await checkPaymentStatus(paymentId, registrationId, retryAttempt + 1)
      }
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setError(null)
    setValidationErrors({})
    setRetryCount(0)
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setIsProcessing(true)
    setPaymentStatus('creating_order')
    
    try {
      // Pre-flight checks with retries
      if (networkStatus === 'offline') {
        const isOnline = await checkNetworkStatus()
        if (!isOnline) {
          throw new Error('No internet connection. Please check your network and try again.')
        }
      }
      
      if (razorpayStatus !== 'loaded') {
        const razorpayLoaded = await checkRazorpayStatus()
        if (!razorpayLoaded) {
          throw new Error('Payment system is currently unavailable. Please refresh the page and try again.')
        }
      }
      
      console.log('Creating order...', formData)
      
      // Create order with robust fetch
      const result = await robustFetch(buildApiUrl(API_ENDPOINTS.CREATE_ORDER), {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      
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
      
      console.log('✅ Order created successfully:', { orderId: result.orderId, amount: result.amount })
      
      // Initialize Razorpay payment with enhanced error handling
      const options = {
        key: config.RAZORPAY_KEY_ID,
        amount: result.amount,
        currency: result.currency,
        name: 'Event Registration',
        description: 'Registration for our amazing event',
        order_id: result.orderId,
        timeout: 300, // 5 minutes timeout
        retry: {
          enabled: true,
          max_count: 3
        },
        handler: async function (response) {
          setPaymentStatus('verifying_payment')
          
          try {
            console.log('Verifying payment...', response.razorpay_payment_id)
            
            const verifyResult = await robustFetch(buildApiUrl(API_ENDPOINTS.VERIFY_PAYMENT), {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                registrationId: result.registrationId
              })
            })
            
            if (verifyResult.success) {
              console.log('✅ Payment verified successfully:', verifyResult.data)
              setRegistrationData(verifyResult.data)
              setPaymentStatus('completed')
              setIsSubmitted(true)
              
              // Show success message based on email status
              setTimeout(() => {
                if (verifyResult.data.emailSent !== false) {
                  alert('🎉 Registration successful! Check your email for the ticket.')
                } else {
                  alert('🎉 Registration and payment successful! Your ticket will be emailed shortly. If you don\'t receive it, please contact support with payment ID: ' + response.razorpay_payment_id)
                }
              }, 500)
            } else {
              throw new Error(verifyResult.message || 'Payment verification failed')
            }
          } catch (verificationError) {
            console.error('Payment verification error:', verificationError)
            
            // If verification times out, try to check status
            if (verificationError.message.includes('timed out') || verificationError.message.includes('Request timed out')) {
              console.log('⏰ Verification timed out, checking payment status...')
              setPaymentStatus('checking_status')
              
              try {
                await checkPaymentStatus(response.razorpay_payment_id, result.registrationId)
              } catch (statusError) {
                console.error('Status check failed:', statusError)
                setPaymentStatus('verification_failed')
                setError(`Payment verification timed out: ${verificationError.message}. Your payment may have been processed. Please contact support with payment ID: ${response.razorpay_payment_id}`)
              }
            } else {
              setPaymentStatus('verification_failed')
              setError(`Payment verification failed: ${verificationError.message}. Your payment may have been processed. Please contact support with payment ID: ${response.razorpay_payment_id}`)
            }
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
            setError('Payment was cancelled. You can try again to complete your registration.')
          },
          escape: true,
          backdropclose: false
        }
      }
      
      console.log('Creating Razorpay instance...')
      
      // Final validation before opening payment
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Payment system failed to load. Please refresh the page and try again.')
      }
      
      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error('No internet connection detected. Please check your connection and try again.')
      }
      
      const rzp = new window.Razorpay(options)
      
      // Enhanced error handling for payment failures
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error)
        setPaymentStatus('failed')
        setIsProcessing(false)
        
        let errorMessage = 'Payment failed. '
        
        // Handle specific Razorpay error codes
        switch(response.error.code) {
          case 'BAD_REQUEST_ERROR':
            if (response.error.reason === 'payment_cancelled') {
              errorMessage = 'Payment was cancelled. You can try again to complete your registration.'
              setPaymentStatus('cancelled')
            } else {
              errorMessage += 'Please check your payment details and try again.'
            }
            break
          case 'GATEWAY_ERROR':
            errorMessage += 'Payment gateway error. Please try a different payment method.'
            break
          case 'NETWORK_ERROR':
            errorMessage += 'Network connection issue. Please check your internet connection and try again.'
            break
          case 'SERVER_ERROR':
            errorMessage += 'Payment server is temporarily unavailable. Please try again in a few minutes.'
            break
          case 'INVALID_REQUEST_ERROR':
            errorMessage += 'Invalid payment request. Please refresh the page and try again.'
            break
          case 'PAYMENT_CANCELLED':
            errorMessage = 'Payment was cancelled. You can try again.'
            break
          default:
            errorMessage += response.error.description || 'Please try again or contact support.'
        }
        
        // Add retry suggestion for network issues
        if (response.error.description && response.error.description.includes('network')) {
          errorMessage += ' If this persists, try using a different network or device.'
        }
        
        setError(errorMessage)
      })
      
      // Enhanced error handling for opening payment modal with retry
      const openPaymentWithRetry = async (retryAttempt = 0) => {
        try {
          // Check if there was a chunk loading error
          if (window.razorpayChunkError) {
            throw new Error('Razorpay resources failed to load due to network issues')
          }
          
          rzp.open()
          console.log('✅ Payment modal opened successfully')
          
          // Monitor for chunk errors after opening
          setTimeout(() => {
            if (window.razorpayChunkError && !document.querySelector('.razorpay-container')) {
              console.error('❌ Razorpay checkout failed to render')
              setPaymentStatus('failed')
              setIsProcessing(false)
              setError('Payment window failed to load completely. This is usually caused by network issues, firewall settings, or ad blockers. Please try: 1) Disabling ad blocker for this site, 2) Using a different network, 3) Refreshing the page.')
            }
          }, 5000)
        } catch (openError) {
          console.error(`Failed to open payment modal (attempt ${retryAttempt + 1}):`, openError)
          
          if (retryAttempt < 2) {
            console.log(`🔄 Retrying payment modal in ${RETRY_DELAY}ms...`)
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
            window.razorpayChunkError = false // Reset for retry
            return openPaymentWithRetry(retryAttempt + 1)
          }
          
          setPaymentStatus('failed')
          setIsProcessing(false)
          setError('Unable to open payment window. This may be caused by: 1) Ad blocker or firewall blocking Razorpay, 2) Poor network connection, 3) Browser popup blocker. Please try disabling ad blockers, using a different browser, or checking your network connection.')
          return
        }
      }
      
      await openPaymentWithRetry()
      
    } catch (error) {
      console.error('Registration error:', error)
      setIsProcessing(false)
      setPaymentStatus('error')
      
      // Enhanced error handling with specific messages
      let errorMessage = error.message || 'An unexpected error occurred'
      
      if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('network')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.'
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorMessage = 'Request timed out. Please check your connection and try again.'
      } else if (error.message.includes('already registered')) {
        errorMessage = 'This email is already registered for the event. Please use a different email or contact support.'
      } else if (error.message.includes('Payment system')) {
        errorMessage = 'Payment service is currently unavailable. Please refresh the page and try again.'
      } else if (error.message.includes('blocked')) {
        errorMessage = 'Payment popup was blocked. Please allow popups for this site and try again.'
      } else if (error.message.includes('HTTP 429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.'
      } else if (error.message.includes('HTTP 5')) {
        errorMessage = 'Server is experiencing issues. Please try again in a few minutes.'
      } else if (!errorMessage || errorMessage === 'Failed to fetch') {
        errorMessage = 'Registration failed. Please check your internet connection and try again.'
      }
      
      setError(errorMessage + ' If the problem persists, please contact our support team.')
      
      // Auto-retry for network-related errors (only once to avoid infinite loops)
      if (retryCount < 1 && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout'))) {
        setTimeout(() => {
          console.log('Auto-retrying registration...')
          setRetryCount(prev => prev + 1)
          setError('Connection failed. Retrying...')
          handleSubmit(e)
        }, RETRY_DELAY)
      }
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
                  {registrationData.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount Paid</span>
                      <span className="text-green-400 font-semibold">₹{(registrationData.amount / 100).toFixed(0)}</span>
                    </div>
                  )}
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
        {/* Status indicators with enhanced error messages */}
        <div className="mb-4 flex justify-center space-x-4 text-sm">
          <div className={`flex items-center space-x-2 ${networkStatus === 'online' ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${networkStatus === 'online' ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span>Network: {networkStatus}</span>
          </div>
          <div className={`flex items-center space-x-2 ${razorpayStatus === 'loaded' ? 'text-green-400' : razorpayStatus === 'retrying' ? 'text-yellow-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${razorpayStatus === 'loaded' ? 'bg-green-400' : razorpayStatus === 'retrying' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
            <span>Payment: {razorpayStatus}</span>
          </div>
        </div>

        {/* System status warnings */}
        {(networkStatus === 'offline' || razorpayStatus === 'failed') && (
          <div className="mb-4 bg-yellow-950 border border-yellow-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-300">System Status Warning</h3>
                <div className="text-sm text-yellow-200 mt-1">
                  {networkStatus === 'offline' && (
                    <p>• Internet connection is unavailable. Please check your network connection.</p>
                  )}
                  {razorpayStatus === 'failed' && (
                    <p>• Payment system is currently unavailable. Try refreshing the page or check your internet connection.</p>
                  )}
                  <p className="mt-2 font-medium">Please resolve these issues before attempting registration.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-700">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Event Registration</h1>
            <p className="text-gray-400 text-sm">Join our amazing event - Only ₹199</p>
          </div>

          {/* Progress indicator */}
          {paymentStatus && (
            <div className="mb-6 bg-[#262626] rounded-lg p-4 border border-gray-600">
              <div className="text-center">
                <h3 className="text-purple-400 font-semibold mb-2 text-sm">Registration Progress</h3>
                <div className="text-white text-sm">
                  {paymentStatus === 'creating_order' && (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
                      <span>Creating order...</span>
                      {isRetrying && <span className="text-yellow-400">(Retrying...)</span>}
                    </div>
                  )}
                  {paymentStatus === 'opening_payment' && (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                      <span>Opening payment window...</span>
                    </div>
                  )}
                  {paymentStatus === 'verifying_payment' && (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
                      <span>Verifying payment...</span>
                    </div>
                  )}
                  {paymentStatus === 'checking_status' && (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                      <span>Checking payment status...</span>
                    </div>
                  )}
                  {paymentStatus === 'cancelled' && <span className="text-yellow-400">Payment cancelled</span>}
                  {paymentStatus === 'failed' && <span className="text-red-400">Payment failed</span>}
                  {paymentStatus === 'verification_failed' && <span className="text-red-400">Payment verification failed</span>}
                  {paymentStatus === 'error' && <span className="text-red-400">Registration error</span>}
                </div>
              </div>
            </div>
          )}

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
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-[#262626] border ${validationErrors.email ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors`}
                placeholder="Enter your email address"
                disabled={isProcessing}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
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
                <option value="Post Graduate">Post Graduate</option>
                <option value="Graduate">Graduate</option>
                <option value="Alumni">Alumni</option>
                <option value="Faculty">Faculty</option>
                <option value="Other">Other</option>
              </select>
              {validationErrors.year && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.year}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !isFormValid || networkStatus === 'offline' || razorpayStatus !== 'loaded'}
            className={`w-full mt-6 py-3 rounded-full text-base font-semibold transition-all duration-300 ${
              isProcessing || !isFormValid || networkStatus === 'offline' || razorpayStatus !== 'loaded'
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </div>
            ) : networkStatus === 'offline' ? (
              'No Internet Connection'
            ) : razorpayStatus !== 'loaded' ? (
              `Payment System ${razorpayStatus === 'retrying' ? 'Loading...' : 'Unavailable'}`
            ) : (
              'Register Now - Pay ₹199'
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Secure payment powered by Razorpay. Your data is safe with us.
          </p>
        </form>
      </div>
    </div>
  )
}

export default EventForm