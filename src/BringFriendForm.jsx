import { useState, useEffect } from 'react'
import config from './config.js'

const BringFriendForm = () => {
  const [step, setStep] = useState(1) // 1: Check eligibility, 2: OTP, 3: Friend form, 4: Payment
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [offerStatus, setOfferStatus] = useState(null)
  const [resendTimer, setResendTimer] = useState(0)
  
  // Step 1: User verification
  const [identifier, setIdentifier] = useState('')
  const [eligibleUser, setEligibleUser] = useState(null)
  
  // Step 2: OTP verification
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  
  // Step 3: Friend details
  const [friendDetails, setFriendDetails] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    year: '1st Year'
  })
  
  // Step 4: Registration result
  const [registrationResult, setRegistrationResult] = useState(null)

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Check if offer is enabled
  useEffect(() => {
    const checkOfferStatus = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/api/friend/status`)
        const result = await response.json()
        setOfferStatus(result.data)
      } catch (error) {
        console.error('Error checking offer status:', error)
        setOfferStatus({ enabled: false })
      }
    }
    
    checkOfferStatus()
  }, [])

  const handleCheckEligibility = async (e) => {
    e.preventDefault()
    if (!identifier.trim()) {
      setError('Please enter your email or ticket number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/friend/check-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() })
      })

      const result = await response.json()

      if (result.success) {
        setEligibleUser(result.data)
        setStep(2)
        setResendTimer(60)
        await sendOTP()
      } else {
        setError(result.message || 'User not eligible for friend referral')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sendOTP = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/friend/verify-existing-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() })
      })

      const result = await response.json()

      if (result.success) {
        setOtpSent(true)
        setResendTimer(60)
      } else {
        setError(result.message || 'Failed to send OTP')
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.')
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter valid 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/friend/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: eligibleUser.userEmail, 
          otp: otp.trim() 
        })
      })

      const result = await response.json()

      if (result.success) {
        setStep(3)
      } else {
        setError(result.message || 'Invalid OTP')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFriendRegistration = async (e) => {
    e.preventDefault()
    
    // Validate friend details
    const { name, email, phone, college, year } = friendDetails
    if (!name.trim() || !email.trim() || !phone.trim() || !college.trim() || !year) {
      setError('Please fill all friend details')
      return
    }

    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      setError('Please enter valid email address')
      return
    }

    if (phone.length < 10) {
      setError('Please enter valid phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/friend/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerEmail: eligibleUser.userEmail,
          friend: friendDetails
        })
      })

      const result = await response.json()

      if (result.success) {
        setRegistrationResult(result.data)
        setStep(4)
      } else {
        setError(result.message || 'Registration failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFriendDetails(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!offerStatus) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black px-4">
        <div className="bg-[#1a1a1a] border border-gray-700 p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-purple-500 mx-auto"></div>
          <p className="mt-4 text-center text-gray-300">Loading offer details...</p>
        </div>
      </div>
    )
  }

  if (!offerStatus.enabled) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black px-4">
        <div className="bg-[#1a1a1a] border border-gray-700 p-8 rounded-2xl text-center max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-white mb-4">Offer Not Available</h2>
          <p className="text-gray-400 mb-6">
            The "Bring Your Friend" offer is currently not available. 
            Please check back later or contact support for more information.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-full font-semibold transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-black px-4">
      <div className="w-full max-w-lg">
        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-700">
          <div className="text-center mb-6">
            <img
              src="/form.png"
              alt="Bring Your Friend"
              className="mx-auto mb-4 max-w-full h-auto rounded-lg"
            />
            <h1 className="text-2xl font-bold text-white mb-2">Bring Your Friend</h1>
            <p className="text-gray-400 text-sm">ACD 2026 Special Offer - Get ₹100 Discount!</p>
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
                  <h3 className="text-sm font-medium text-red-300">Error</h3>
                  <div className="text-sm text-red-200 mt-1">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Step Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span className={step === 1 ? 'text-purple-400 font-semibold' : ''}>Step 1: Verify</span>
                <span className={step === 2 ? 'text-purple-400 font-semibold' : ''}>Step 2: OTP</span>
                <span className={step === 3 ? 'text-purple-400 font-semibold' : ''}>Step 3: Details</span>
                <span className={step === 4 ? 'text-purple-400 font-semibold' : ''}>Step 4: Payment</span>
              </div>
              <div className="flex gap-1">
                <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-purple-600' : 'bg-gray-700'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-purple-600' : 'bg-gray-700'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-purple-600' : 'bg-gray-700'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${step >= 4 ? 'bg-purple-600' : 'bg-gray-700'}`}></div>
              </div>
            </div>

            {/* Offer Info Box */}
            <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-4 border border-purple-600 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-white text-sm">Friend's Special Price</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm line-through">₹199</span>
                  <span className="text-xl font-bold text-white">₹99</span>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Save ₹100!</span>
                </div>
              </div>
            </div>

          {/* Step 1: Check Eligibility */}
          {step === 1 && (
            <div>
              <div className="border-t border-gray-600 pt-4 mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">Verify Your Registration</h3>
                <p className="text-sm text-gray-400">Enter your email or ticket number to check eligibility</p>
              </div>

              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-300 mb-1">
                  Email or Ticket Number *
                </label>
                <input
                  type="text"
                  id="identifier"
                  placeholder="your.email@example.com or #TICKET123"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleCheckEligibility}
                disabled={loading}
                className={`w-full mt-6 py-3 rounded-full text-base font-semibold transition-all duration-300 ${
                  loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Checking...</span>
                  </div>
                ) : (
                  'Check Eligibility'
                )}
              </button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <>
              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-lg font-semibold text-white mb-1">Verify OTP</h3>
                <p className="text-sm text-gray-400">We've sent a 6-digit code to {eligibleUser?.userEmail}</p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-1">
                  OTP Code *
                </label>
                <input
                  type="text"
                  id="otp"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2 bg-[#262626] border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-purple-500 transition-colors"
                  disabled={loading}
                  maxLength={6}
                />
                <div className="mt-2 text-center">
                  {resendTimer > 0 ? (
                    <p className="text-xs text-gray-400">
                      Resend OTP in <span className="font-bold text-purple-400">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOTP}
                      className="text-xs text-purple-400 hover:text-purple-300 underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className={`w-full mt-6 py-3 rounded-full text-base font-semibold transition-all duration-300 ${
                  loading || otp.length !== 6
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify OTP'
                )}
              </button>

              <button
                onClick={() => setStep(1)}
                className="w-full mt-3 bg-[#262626] hover:bg-[#333333] text-gray-300 py-2 rounded-full font-medium transition-colors"
              >
                Back
              </button>
            </>
          )}

          {/* Step 3: Friend Details */}
          {step === 3 && (
            <>
              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-lg font-semibold text-white mb-1">Friend's Details</h3>
                <p className="text-sm text-gray-400">Fill in your friend's information</p>
              </div>

              <div>
                <label htmlFor="friendName" className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="friendName"
                  value={friendDetails.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label htmlFor="friendEmail" className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="friendEmail"
                  value={friendDetails.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label htmlFor="friendPhone" className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="friendPhone"
                  value={friendDetails.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter 10-digit phone number"
                />
              </div>
              
              <div>
                <label htmlFor="friendCollege" className="block text-sm font-medium text-gray-300 mb-1">
                  College/University *
                </label>
                <input
                  type="text"
                  id="friendCollege"
                  value={friendDetails.college}
                  onChange={(e) => handleInputChange('college', e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter college or university name"
                />
              </div>
              
              <div>
                <label htmlFor="friendYear" className="block text-sm font-medium text-gray-300 mb-1">
                  Academic Year *
                </label>
                <select
                  id="friendYear"
                  value={friendDetails.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="">Select academic year</option>
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
              </div>

              <button
                onClick={handleFriendRegistration}
                disabled={loading}
                className={`w-full mt-6 py-3 rounded-full text-base font-semibold transition-all duration-300 ${
                  loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Register Friend - ₹99'
                )}
              </button>
              
              <button
                onClick={() => setStep(2)}
                className="w-full mt-3 bg-[#262626] hover:bg-[#333333] text-gray-300 py-2 rounded-full font-medium transition-colors"
              >
                Back
              </button>
            </>
          )}

          {/* Step 4: Success & Payment */}
          {step === 4 && registrationResult && (
            <>
              <div className="text-center py-4">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="text-xl font-bold text-white mb-2">Registration Successful!</h3>
                <p className="text-sm text-gray-400">
                  Your friend has been registered with ₹100 discount
                </p>
              </div>
              
              <div className="bg-[#262626] border border-gray-600 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purple-400 mb-3 text-center">
                  Payment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Original Price:</span>
                    <span className="line-through">₹199</span>
                  </div>
                  <div className="flex justify-between text-green-400 font-semibold">
                    <span>Friend Discount:</span>
                    <span>-₹100</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 flex justify-between items-center">
                    <span className="font-bold text-white">Total Amount:</span>
                    <span className="font-bold text-xl text-white">₹99</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#262626] border border-gray-600 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">Next Steps</h3>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li>• Complete payment of ₹99</li>
                  <li>• Admin verification (within 24 hours)</li>
                  <li>• E-ticket will be sent via email</li>
                </ul>
              </div>
              
              <button
                onClick={() => window.location.href = `/payment/${registrationResult.registrationId}`}
                className="w-full mt-6 py-3 rounded-full text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Continue to Payment - ₹99
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full mt-3 bg-[#262626] hover:bg-[#333333] text-gray-300 py-2 rounded-full font-medium transition-colors"
              >
                Maybe Later
              </button>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BringFriendForm