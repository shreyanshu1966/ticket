import { useState, useRef, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import config from './config.js'
import ScannerAuth from './ScannerAuth'

const QRScanner = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [entryConfirmed, setEntryConfirmed] = useState(false)

  // Enhanced camera controls
  const [torch, setTorch] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [cameraFacing, setCameraFacing] = useState('environment')
  const [showControls, setShowControls] = useState(false)
  const [scannerActive, setScannerActive] = useState(true)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Camera capabilities tracking
  const [cameraCapabilities, setCameraCapabilities] = useState({
    torch: false,
    zoom: false,
    focus: false
  })

  // Check authentication on component mount
  useEffect(() => {
    const authStatus = localStorage.getItem('scannerAuth')
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  // Effect to detect camera capabilities
  useEffect(() => {
    const detectCameraCapabilities = async () => {
      try {
        if (streamRef.current) {
          const track = streamRef.current.getVideoTracks()[0]
          if (track) {
            const capabilities = track.getCapabilities()
            setCameraCapabilities({
              torch: 'torch' in capabilities,
              zoom: 'zoom' in capabilities,
              focus: 'focusMode' in capabilities
            })

            // Apply initial settings for optimal scanning
            if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
              await track.applyConstraints({
                focusMode: 'continuous'
              })
            }
          }
        }
      } catch (err) {
        console.warn('Could not detect camera capabilities:', err)
      }
    }

    if (scannerActive) {
      detectCameraCapabilities()
    }
  }, [scannerActive, streamRef.current])

  // Enhanced camera controls
  const toggleTorch = async () => {
    try {
      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0]
        if (track && cameraCapabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !torch }]
          })
          setTorch(!torch)
        }
      }
    } catch (err) {
      console.error('Torch toggle error:', err)
      setError('Failed to toggle flashlight')
    }
  }

  const handleZoomChange = async (newZoom) => {
    try {
      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0]
        if (track && cameraCapabilities.zoom) {
          await track.applyConstraints({
            zoom: newZoom
          })
          setZoom(newZoom)
        }
      }
    } catch (err) {
      console.error('Zoom change error:', err)
      setError('Failed to adjust zoom')
    }
  }

  const switchCamera = () => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment'
    setCameraFacing(newFacing)
    setScannerActive(false)
    setTimeout(() => setScannerActive(true), 100)
  }

  const focusCamera = async () => {
    try {
      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0]
        if (track && cameraCapabilities.focus) {
          await track.applyConstraints({
            focusMode: 'single-shot'
          })
        }
      }
    } catch (err) {
      console.error('Focus error:', err)
    }
  }

  const verifyTicket = async (qrData) => {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/tickets/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qrData })
      })

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setVerificationResult(result.data)
        setSuccessMessage('Ticket verified successfully!')
      } else {
        // Enhanced error handling for duplicate entries
        if (result.error === 'DUPLICATE_ENTRY' && result.data) {
          const errorMsg = result.data.warningMessage || result.message
          setError(`⚠️ DUPLICATE ENTRY: ${errorMsg}`)

          // Show additional details in verification result for display
          setVerificationResult({
            ...result.data,
            hasEntered: true,
            entryTime: result.data.scannedAt,
            isDuplicate: true
          })

          console.warn('🚫 Duplicate entry attempt:', {
            name: result.data.name,
            ticketNumber: result.data.ticketNumber,
            previousEntry: result.data.scannedAtFormatted
          })
        } else {
          setError(result.message || 'Invalid ticket')
          setVerificationResult(null)
        }
      }
    } catch (err) {
      console.error('Verification error:', err)
      if (err.message.includes('Server error: 404')) {
        setError('Verification service not available. Please check if the backend server is running.')
      } else if (err.message.includes('Server error: 400')) {
        setError('Invalid ticket data. Please ensure the QR code is from a valid ACD 2026 ticket.')
      } else {
        setError('Failed to verify ticket. Please try again.')
      }
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
      const response = await fetch(`${config.API_BASE_URL}/api/tickets/confirm-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registrationId: verificationResult.registrationId,
          ticketNumber: verificationResult.ticketNumber,
          isGroupMember: verificationResult.isGroupMember || false,
          groupMemberId: verificationResult.groupMemberId || null
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccessMessage('Entry confirmed! Welcome to ACD 2026!')
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

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }

      // Audio feedback
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH8N2QQAoUXrTp66hVFApGm+DyvmwhBytqwenHfiwFJHfH0=').play()
      } catch (e) {
        // Audio feedback failed, continue
      }
    }
  }

  const handleError = (error) => {
    console.error('QR Scanner error:', error)

    // Provide specific error messages based on error type
    if (error?.name === 'NotAllowedError') {
      setError('Camera permission denied. Please allow camera access to scan QR codes.')
    } else if (error?.name === 'NotFoundError') {
      setError('No camera found. Please check if your device has a camera.')
    } else if (error?.name === 'NotReadableError') {
      setError('Camera is being used by another application. Please close other camera apps.')
    } else if (error?.name === 'OverconstrainedError') {
      setError('Camera settings not supported. Trying alternative settings...')
      // Try with basic constraints
      setTimeout(() => {
        setScannerActive(false)
        setTimeout(() => setScannerActive(true), 100)
      }, 1000)
    } else {
      setError('Camera error occurred. Please try refreshing the page or check camera permissions.')
    }
  }

  const resetScanner = () => {
    setScannedData(null)
    setVerificationResult(null)
    setError('')
    setSuccessMessage('')
    setEntryConfirmed(false)
    setShowControls(false)
    setScannerActive(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('scannerAuth')
    setIsAuthenticated(false)
  }

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return <ScannerAuth onAuthenticate={setIsAuthenticated} />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              🎫 ACD 2026 Entry Scanner
            </h1>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
            >
              Logout
            </button>
          </div>

          {/* Scanner */}
          {!scannedData && scannerActive && (
            <div className="mb-6">
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <Scanner
                  onScan={handleScan}
                  onError={handleError}
                  onResult={(result, error, codeReader) => {
                    if (codeReader && codeReader.stream) {
                      streamRef.current = codeReader.stream
                    }
                  }}
                  constraints={{
                    video: {
                      facingMode: cameraFacing,
                      width: { ideal: 480 },
                      height: { ideal: 480 },
                      focusMode: 'continuous'
                    }
                  }}
                  formats={['qr_code']}
                  className="w-full h-full"
                />

                {/* Scanner overlay with scanning area */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner markers */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-3 border-t-3 border-white"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-3 border-t-3 border-white"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-3 border-b-3 border-white"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-3 border-b-3 border-white"></div>

                  {/* Scanning line animation */}
                  <div className="absolute inset-x-4 top-1/2 h-0.5 bg-green-400 opacity-75 animate-pulse"></div>
                </div>

                {/* Camera Controls */}
                <div className="absolute top-2 right-2 flex gap-2">
                  {/* Settings Toggle */}
                  <button
                    onClick={() => setShowControls(!showControls)}
                    className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                {/* Flash/Torch Toggle */}
                {cameraCapabilities.torch && (
                  <button
                    onClick={toggleTorch}
                    className={`absolute bottom-2 right-2 p-2 rounded-full ${torch ? 'bg-yellow-500 text-black' : 'bg-black bg-opacity-50 text-white'
                      } hover:bg-opacity-70`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </button>
                )}

                {/* Focus Button */}
                {cameraCapabilities.focus && (
                  <button
                    onClick={focusCamera}
                    className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Advanced Camera Controls Panel */}
              {showControls && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg space-y-4">
                  <h4 className="font-semibold text-gray-800">Camera Controls</h4>

                  {/* Camera Switch */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Camera</span>
                    <button
                      onClick={switchCamera}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      {cameraFacing === 'environment' ? '📷 Back' : '🤳 Front'}
                    </button>
                  </div>

                  {/* Zoom Control */}
                  {cameraCapabilities.zoom && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Zoom</span>
                        <span className="text-sm text-gray-800">{zoom.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Scanner Stats */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>🔍 Auto-focus: {cameraCapabilities.focus ? 'Enabled' : 'Not available'}</div>
                    <div>🔦 Flash: {cameraCapabilities.torch ? 'Available' : 'Not available'}</div>
                    <div>🔍 Zoom: {cameraCapabilities.zoom ? 'Available' : 'Not available'}</div>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600 text-center mt-2">
                🎯 Position QR code within the frame • Tap settings for controls
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
                {verificationResult.isGroupMember && (
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-medium">Type:</span>
                    <span className="text-purple-800 bg-purple-100 px-2 py-1 rounded-full text-xs font-medium">
                      Group Member Ticket
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-blue-600 font-medium">Amount:</span>
                  <span className="text-blue-800">₹{verificationResult.amount / 100}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 font-medium">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${verificationResult.hasEntered
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
              <h3 className="text-xl font-bold text-green-800 mb-2">Welcome to ACD 2026!</h3>
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

            {!scannedData && !scannerActive && (
              <button
                onClick={() => setScannerActive(true)}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                🔄 Restart Scanner
              </button>
            )}
          </div>

          {/* Enhanced Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">📋 Scanner Features & Instructions:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>Auto-Focus:</strong> Camera continuously focuses for sharp QR codes</li>
              <li>• <strong>Flash Control:</strong> Tap the flash icon for better lighting</li>
              <li>• <strong>Zoom:</strong> Use zoom slider in settings for distant codes</li>
              <li>• <strong>Manual Focus:</strong> Tap focus button to refocus manually</li>
              <li>• <strong>Camera Switch:</strong> Switch between front/back cameras</li>
              <li>• Position QR code within the corner guides</li>
              <li>• Wait for automatic scan and haptic/audio feedback</li>
              <li>• Each ticket can only be used once</li>
            </ul>

            <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
              <strong>💡 Pro Tip:</strong> For best results, ensure good lighting and hold the device steady.
              The scanner will automatically detect and verify tickets in real-time.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRScanner
