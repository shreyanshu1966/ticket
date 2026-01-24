import { useState } from 'react'

const PaymentVerificationModal = ({ registration, isOpen, onClose, onVerify }) => {
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen || !registration) return null

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      await onVerify(registration._id, true, notes, '')
      onClose()
    } catch (error) {
      console.error('Approval failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    
    setIsProcessing(true)
    try {
      await onVerify(registration._id, false, notes, rejectionReason)
      onClose()
    } catch (error) {
      console.error('Rejection failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Payment Verification - {registration.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={isProcessing}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Registration Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Registration Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{registration.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{registration.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{registration.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">College:</span>
                  <span className="font-medium">{registration.college}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Year:</span>
                  <span className="font-medium">{registration.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration Date:</span>
                  <span className="font-medium">{formatDate(registration.registrationDate)}</span>
                </div>
                {registration.isGroupBooking && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking Type:</span>
                      <span className="font-medium text-purple-600">Group Booking</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Tickets:</span>
                      <span className="font-medium">{registration.ticketQuantity}</span>
                    </div>
                    {registration.ticketQuantity >= 4 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Free Tickets:</span>
                        <span className="font-medium text-green-600">
                          {Math.floor(registration.ticketQuantity / 4)} FREE!
                        </span>
                      </div>
                    )}
                    {registration.groupMembers && registration.groupMembers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-gray-600 font-medium mb-2">Group Members:</div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {registration.groupMembers.map((member, idx) => (
                            <div key={idx} className="text-xs bg-gray-100 rounded p-2">
                              <div className="font-medium text-gray-800">{member.name}</div>
                              <div className="text-gray-600">{member.email}</div>
                              <div className="text-gray-500">{member.college} • {member.year}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    {registration.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium">₹{(registration.totalAmount || registration.amount) / 100}</span>
                </div>
                {registration.isGroupBooking && registration.ticketQuantity >= 4 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Savings:</span>
                    <span className="font-medium text-green-600">₹{Math.floor(registration.ticketQuantity / 4) * 199}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">₹{registration.amount / 100}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">UTR Number:</span>
                  <span className="font-medium font-mono text-xs">{registration.upiTransactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted At:</span>
                  <span className="font-medium">{formatDate(registration.paymentSubmittedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Screenshot */}
          {registration.paymentScreenshot && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Screenshot</h3>
              <div className="flex justify-center">
                <img 
                  src={registration.paymentScreenshot} 
                  alt="Payment screenshot" 
                  className="max-w-full max-h-96 object-contain border border-gray-300 rounded shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Verification Notes (Optional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the payment verification..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              disabled={isProcessing}
            />
          </div>

          {/* Rejection Reason (only show when needed) */}
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-3">Rejection Reason (Required if rejecting)</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why the payment is being rejected..."
              className="w-full p-3 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="3"
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Reject Payment'}
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Approve & Send Ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentVerificationModal