import { useState, useRef, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import config from './config.js'

const QRScanner = () => {
  const [scannedData, setScannedData] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [entryConfirmed, setEntryConfirmed] = useState(false)

  const verifyTicket = async (qrData) => {
    setLoading(true)
    setError('')
    setSuccessMessage('')
    
    try {
      const response = await fetch(`${config.API_URL}/api/tickets/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qrData })
      })

      const result = await response.json()

      if (result.success) {
        setVerificationResult(result.data)
        setSuccessMessage('Ticket verified successfully!')
      } else {
        setError(result.message || 'Invalid ticket')
        setVerificationResult(null)
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError('Failed to verify ticket. Please try again.')
      setVerificationResult(null)
    } finally {
      setLoading(false)
    }
  }

  const confirmEntry = async () => {
    if (!verificationResult) return

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${config.API_URL}/api/tickets/confirm-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          registrationId: verificationResult.registrationId,
          ticketNumber: verificationResult.ticketNumber
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccessMessage('Entry confirmed! Welcome to ACD 2025!')
        setEntryConfirmed(true)
        // Clear data after 3 seconds for next scan
        setTimeout(() => {
          setScannedData(null)
          setVerificationResult(null)
          setEntryConfirmed(false)
          setSuccessMessage('')
        }, 3000)
      } else {
        setError(result.message || 'Failed to confirm entry')
      }
    } catch (err) {
      console.error('Entry confirmation error:', err)
      setError('Failed to confirm entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleScan = (result) => {
    if (result && result.length > 0 && !scannedData) {
      const scannedText = result[0].rawValue
      setScannedData(scannedText)
      verifyTicket(scannedText)
    }
  }

  const handleError = (error) => {
    console.error('QR Scanner error:', error)
    setError('Camera error. Please check permissions.')
  }

  const resetScanner = () => {
    setScannedData(null)
    setVerificationResult(null)
    setError('')
    setSuccessMessage('')
    setEntryConfirmed(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            🎫 ACD 2025 Entry Scanner
          </h1>

          {/* Scanner */}
          {!scannedData && (
            <div className="mb-6">
              <div className="aspect-square bg-black rounded-lg overflow-hidden">
                <Scanner
                  onScan={handleScan}
                  onError={handleError}
                  constraints={{
                    video: { 
                      facingMode: 'environment',
                      width: { ideal: 400 },
                      height: { ideal: 400 }
                    }
                  }}
                  formats={['qr_code']}
                  className="w-full h-full"
                />
              </div>
              <p className="text-sm text-gray-600 text-center mt-2">
                Position QR code within the frame
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Verifying ticket...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-xl">❌</span>
                </div>
                <div className="ml-3">
                  <p className="text-red-800 font-medium">Verification Failed</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-green-400 text-xl">✅</span>
                </div>
                <div className="ml-3">
                  <p className="text-green-800 font-medium">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && !entryConfirmed && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Ticket Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-600 font-medium">Name:</span>
                  <span className="text-blue-800">{verificationResult.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 font-medium">Email:</span>
                  <span className="text-blue-800">{verificationResult.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 font-medium">College:</span>
                  <span className="text-blue-800">{verificationResult.college}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 font-medium">Year:</span>
                  <span className="text-blue-800">{verificationResult.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 font-medium">Ticket #:</span>
                  <span className="text-blue-800 font-mono">{verificationResult.ticketNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 font-medium">Amount:</span>
                  <span className="text-blue-800">₹{verificationResult.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 font-medium">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    verificationResult.hasEntered 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {verificationResult.hasEntered ? 'Already Entered' : 'Valid for Entry'}
                  </span>
                </div>
              </div>

              {!verificationResult.hasEntered && (
                <button
                  onClick={confirmEntry}
                  disabled={loading}
                  className="w-full mt-4 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Confirming...' : 'Confirm Entry'}
                </button>
              )}

              {verificationResult.hasEntered && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-red-800 text-sm text-center">
                    ⚠️ This ticket has already been used for entry
                  </p>
                  {verificationResult.entryTime && (
                    <p className="text-red-600 text-xs text-center mt-1">
                      Entered on: {new Date(verificationResult.entryTime).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Entry Confirmed */}
          {entryConfirmed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">Welcome to ACD 2025!</h3>
              <p className="text-green-600">Entry confirmed successfully</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {scannedData && !entryConfirmed && (
              <button
                onClick={resetScanner}
                className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700"
              >
                Scan Another
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">📋 Instructions:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Position QR code within camera frame</li>
              <li>• Wait for automatic verification</li>
              <li>• Check attendee details carefully</li>
              <li>• Confirm entry only after ID verification</li>
              <li>• Each ticket can only be used once</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRScanner