import { useState } from 'react'

function PaymentSuccess({ registrationData, onStartOver }) {
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
            Payment Submitted!
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            Your payment details have been submitted for verification
          </p>

          {registrationData && (
            <div className="bg-[#262626] rounded-lg p-4 mb-6 text-left border border-gray-600">
              <h3 className="font-semibold text-purple-400 mb-3 text-sm">
                Submission Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Booking Type</span>
                  <span className="text-blue-400 font-semibold">Individual Booking</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Registration ID</span>
                  <span className="text-white font-mono text-xs">{registrationData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Registrant Name</span>
                  <span className="text-white">{registrationData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email</span>
                  <span className="text-white">{registrationData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Amount</span>
                  <span className="text-white font-bold">₹{registrationData.totalAmount ? (registrationData.totalAmount / 100) : (registrationData.amount / 100)}</span>
                </div>
                {registrationData.isFriendReferral && registrationData.friendDiscountApplied && (
                  <div className="bg-green-900/30 border border-green-600/50 rounded p-3 mt-2">
                    <div className="text-center mb-2">
                      <span className="text-green-400 font-semibold text-xs">🎉 Friend Referral Discount Applied!</span>
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
                        <span className="text-white font-semibold">You Paid:</span>
                        <span className="text-white font-bold">₹{registrationData.totalAmount ? (registrationData.totalAmount / 100) : (registrationData.amount / 100)}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Status</span>
                  <span className="bg-yellow-600 text-yellow-100 px-2 py-1 rounded text-xs">
                    Pending Verification
                  </span>
                </div>
                {registrationData.upiTransactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">UTR Number</span>
                    <span className="text-white font-mono text-xs">{registrationData.upiTransactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Submitted At</span>
                  <span className="text-white text-xs">
                    {registrationData.paymentSubmittedAt ? 
                      new Date(registrationData.paymentSubmittedAt).toLocaleString() : 
                      new Date().toLocaleString()
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="text-green-400 font-semibold mb-1">Next Steps:</p>
                <ul className="text-green-200 space-y-1 text-xs">
                  <li>• Our admin team will verify your payment within 24 hours</li>
                  <li>• You'll receive your event ticket via email once verified</li>
                  <li>• Keep your UTR number safe for reference</li>
                  <li>• Contact support if you don't hear back within 24 hours</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm">
                <p className="text-yellow-400 font-semibold mb-1">Important Note:</p>
                <p className="text-yellow-200 text-xs">
                  Make sure to check your spam/junk folder for the ticket email. 
                  If you need to make any changes or have issues, contact our support team.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onStartOver}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-base font-semibold transition-colors"
          >
            Register Another Person
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess