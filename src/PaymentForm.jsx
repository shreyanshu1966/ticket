import { useState, useEffect, useRef } from 'react'
import { buildApiUrl, PAYMENT_CONFIG } from './config.js'

function PaymentForm({ registrationData, onPaymentComplete }) {
  const [utrNumber, setUtrNumber] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showInstructions, setShowInstructions] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const fileInputRef = useRef(null)

  // UPI payment details from config and registration data
  const { UPI_ID, EVENT_NAME } = PAYMENT_CONFIG
  const PAYMENT_AMOUNT = registrationData.totalAmount ? (registrationData.totalAmount / 100) : (registrationData.amount / 100)

  // Detect if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()))
    }
    checkMobile()
  }, [])


  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      setScreenshot(null)
      setPreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      setScreenshot(null)
      setPreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
            <img
              src="/form.png"
              alt="Payment"
              className="mx-auto mb-4 max-w-full h-auto rounded-lg"
            />
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
              <h3 className="font-semibold text-purple-400 mb-2">Booking Details</h3>
              <div className="text-sm space-y-2">


                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-bold">₹{PAYMENT_AMOUNT}</span>
                </div>
                {registrationData.isFriendReferral && registrationData.friendDiscountApplied && (
                  <div className="bg-green-900/30 border border-green-600/50 rounded p-3 mt-2">
                    <div className="text-center mb-2">
                      <span className="text-green-400 font-semibold text-sm">🎉 Friend Referral Discount Applied!</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Original Price:</span>
                        <span className="text-gray-400 line-through">₹{registrationData.originalAmount / 100}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-400">Friend Discount:</span>
                        <span className="text-green-400">-₹{registrationData.friendDiscountApplied / 100}</span>
                      </div>
                      <div className="flex justify-between border-t border-green-600/30 pt-1 mt-1">
                        <span className="text-white font-semibold">You Pay:</span>
                        <span className="text-white font-bold">₹{PAYMENT_AMOUNT}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">UPI ID:</span>
                  <span className="text-white font-mono text-xs">{UPI_ID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Primary Name:</span>
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
              {/* QR Code Section for Mobile */}
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

              {/* Copy UPI ID Option */}
              <div className="bg-[#262626] rounded-lg p-4 border border-gray-600">
                <h3 className="font-semibold text-green-400 mb-2 text-sm text-center">Or Pay Using UPI ID</h3>
                <p className="text-gray-400 text-xs mb-3 text-center">
                  Copy the UPI ID below and pay manually in any UPI app
                </p>
                <div className="bg-[#1a1a1a] rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">UPI ID</p>
                      <p className="text-white font-mono text-sm">{UPI_ID}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(UPI_ID)
                        alert('UPI ID copied to clipboard!')
                      }}
                      className="ml-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Amount:</span>
                      <span className="text-white font-bold">₹{PAYMENT_AMOUNT}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2 text-center">
                  Open your UPI app → Enter this UPI ID → Pay ₹{PAYMENT_AMOUNT}
                </p>
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
              ref={fileInputRef}
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