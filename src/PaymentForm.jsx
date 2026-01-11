import { useState, useEffect } from 'react'
import { buildApiUrl, PAYMENT_CONFIG } from './config.js'

function PaymentForm({ registrationData, onPaymentComplete }) {
  const [utrNumber, setUtrNumber] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showInstructions, setShowInstructions] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // UPI payment details from config
  const { UPI_ID, AMOUNT: PAYMENT_AMOUNT, EVENT_NAME } = PAYMENT_CONFIG

  // Detect if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()))
    }
    checkMobile()
  }, [])

  const generateUPILink = (appScheme = null) => {
    const baseParams = `pa=${UPI_ID}&pn=${encodeURIComponent(EVENT_NAME)}&am=${PAYMENT_AMOUNT}&cu=INR&tn=${encodeURIComponent(`Registration: ${registrationData.name}`)}`

    // App-specific deep links
    if (appScheme === 'phonepe') {
      return `phonepe://pay?${baseParams}`
    } else if (appScheme === 'paytm') {
      return `paytmmp://pay?${baseParams}`
    } else if (appScheme === 'gpay') {
      return `tez://upi/pay?${baseParams}`
    } else if (appScheme === 'bhim') {
      return `bhim://pay?${baseParams}`
    }

    // Generic UPI intent (works with most apps)
    return `upi://pay?${baseParams}`
  }

  const handleUPIPay = (appScheme = null) => {
    const upiLink = generateUPILink(appScheme)

    // Try to open UPI app
    window.location.href = upiLink

    // Also provide fallback options
    setTimeout(() => {
      setShowInstructions(false)
    }, 2000)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setScreenshot(file)

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target.result)
    }
    reader.readAsDataURL(file)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!utrNumber.trim()) {
      setError('Please enter UTR number')
      return
    }

    if (!screenshot) {
      setError('Please upload payment screenshot')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Convert image to base64
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64Screenshot = reader.result

          const response = await fetch(buildApiUrl('/api/registrations/submit-payment'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              registrationId: registrationData.id,
              upiTransactionId: utrNumber.trim(),
              paymentScreenshot: base64Screenshot,
              paymentMethod: 'upi',
              amount: PAYMENT_AMOUNT
            })
          })

          const result = await response.json()

          if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to submit payment details')
          }

          onPaymentComplete(result.data)
        } catch (error) {
          console.error('Payment submission error:', error)
          setError(error.message || 'Failed to submit payment details. Please try again.')
          setIsSubmitting(false)
        }
      }
      reader.readAsDataURL(screenshot)
    } catch (error) {
      console.error('Payment submission error:', error)
      setError('Failed to submit payment details. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (showInstructions) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black px-4 py-8">
        <div className="w-full max-w-2xl bg-[#1a1a1a] rounded-2xl p-8 border border-gray-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Complete Payment
            </h2>
            <p className="text-gray-400 mb-6">
              Pay ₹{PAYMENT_AMOUNT} using any UPI app
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-[#262626] rounded-lg p-4 border border-gray-600">
              <h3 className="font-semibold text-purple-400 mb-2">Payment Details</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-bold">₹{PAYMENT_AMOUNT}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">UPI ID:</span>
                  <span className="text-white font-mono text-xs">{UPI_ID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{registrationData.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Show QR Code, Mobile: Show UPI Button */}
          {!isMobile ? (
            <div className="space-y-4 mb-6">
              <div className="bg-[#262626] rounded-lg p-6 border border-gray-600">
                <h3 className="font-semibold text-purple-400 mb-4 text-center">Scan QR Code to Pay</h3>

                {/* Warning about PhonePe Gallery Limitation */}
                <div className="mb-4 bg-red-900/30 border border-red-600/50 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-xs">
                      <p className="text-red-400 font-semibold mb-1">PhonePe Users - Important!</p>
                      <p className="text-red-200">
                        <strong>DO NOT download this QR code and open from gallery.</strong> PhonePe limits gallery payments to ₹2,000. Instead, scan this QR code directly using your phone's camera or PhonePe's scan feature.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-lg">
                    <img
                      src="/upi_qr.jpeg"
                      alt="UPI QR Code"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                </div>
                <p className="text-center text-gray-400 text-sm">
                  Open any UPI app on your phone and <strong>scan this QR code directly</strong>
                </p>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all"
              >
                I have completed the payment
              </button>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="bg-[#262626] rounded-lg p-4 border border-gray-600">
                <h3 className="font-semibold text-purple-400 mb-3 text-center">Choose Your UPI App</h3>

                {/* Warning about PhonePe Gallery Limitation */}
                <div className="mb-4 bg-red-900/30 border border-red-600/50 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-xs">
                      <p className="text-red-400 font-semibold mb-1">PhonePe Users - Important!</p>
                      <p className="text-red-200">
                        If you see "can only pay ₹2,000 via gallery" error, use the buttons below instead of downloading the QR code. These buttons will open PhonePe directly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleUPIPay('phonepe')}
                    className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold flex flex-col items-center justify-center space-y-1 transition-all"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                    </svg>
                    <span className="text-sm">PhonePe</span>
                  </button>

                  <button
                    onClick={() => handleUPIPay('gpay')}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold flex flex-col items-center justify-center space-y-1 transition-all"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <span className="text-sm">Google Pay</span>
                  </button>

                  <button
                    onClick={() => handleUPIPay('paytm')}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-4 rounded-lg font-semibold flex flex-col items-center justify-center space-y-1 transition-all"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                    </svg>
                    <span className="text-sm">Paytm</span>
                  </button>

                  <button
                    onClick={() => handleUPIPay('bhim')}
                    className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-semibold flex flex-col items-center justify-center space-y-1 transition-all"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                    </svg>
                    <span className="text-sm">BHIM UPI</span>
                  </button>
                </div>

                <button
                  onClick={() => handleUPIPay()}
                  className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-semibold text-sm transition-all"
                >
                  Other UPI Apps
                </button>
              </div>

              <div className="text-center">
                <span className="text-gray-500 text-sm">OR</span>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all"
              >
                I have completed the payment
              </button>
            </div>
          )}

          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm">
                <p className="text-yellow-400 font-semibold mb-1">Important Instructions:</p>
                <ul className="text-yellow-200 space-y-1 text-xs">
                  <li>• Make payment of exactly ₹{PAYMENT_AMOUNT}</li>
                  <li>• Save the UTR number from payment</li>
                  <li>• Take a screenshot of payment confirmation</li>
                  <li>• Admin will verify and send your ticket</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-black px-4">
      <div className="w-full max-w-lg bg-[#1a1a1a] rounded-2xl p-8 border border-gray-700">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Verify Payment
          </h2>
          <p className="text-gray-400 mb-6">
            Please provide payment details for verification
          </p>
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
                <div className="text-sm text-red-200 mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              UPI Transaction ID / UTR Number *
            </label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="w-full px-3 py-2 bg-[#262626] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Enter 12-digit UTR number"
              disabled={isSubmitting}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Found in your payment confirmation message
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Payment Screenshot *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-[#262626] border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:outline-none focus:border-purple-500 transition-colors"
              disabled={isSubmitting}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Upload screenshot of payment confirmation (Max 5MB)
            </p>
          </div>

          {previewUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Screenshot Preview
              </label>
              <div className="bg-[#262626] rounded-lg p-4 border border-gray-600">
                <img
                  src={previewUrl}
                  alt="Payment screenshot preview"
                  className="w-full h-48 object-contain rounded border border-gray-500"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowInstructions(true)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
              disabled={isSubmitting}
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              disabled={isSubmitting || !utrNumber.trim() || !screenshot}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit for Verification</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">
              <p className="text-blue-400 font-semibold mb-1">What happens next?</p>
              <ul className="text-blue-200 space-y-1 text-xs">
                <li>• Admin will verify your payment within 24 hours</li>
                <li>• You'll receive your ticket via email once verified</li>
                <li>• Check your spam folder if you don't see it</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentForm