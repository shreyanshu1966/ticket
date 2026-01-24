import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { buildApiUrl } from './config.js'
import PaymentForm from './PaymentForm.jsx'
import PaymentSuccess from './PaymentSuccess.jsx'

function PaymentPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [registrationData, setRegistrationData] = useState(null)
    const [paymentComplete, setPaymentComplete] = useState(false)

    useEffect(() => {
        const fetchRegistration = async () => {
            try {
                const response = await fetch(buildApiUrl(`/api/registrations/${id}`))
                const result = await response.json()

                if (!result.success) {
                    throw new Error(result.message || 'Failed to fetch registration')
                }

                const registration = result.data

                // Check payment status
                if (registration.paymentStatus === 'pending') {
                    // Good to proceed with payment
                    setRegistrationData({
                        id: registration._id,
                        name: registration.name,
                        email: registration.email,
                        college: registration.college,
                        year: registration.year,
                        amount: registration.amount,
                        totalAmount: registration.totalAmount,
                        originalAmount: registration.originalAmount,
                        isFriendReferral: registration.isFriendReferral,
                        friendDiscountApplied: registration.friendDiscountApplied,
                        paymentStatus: registration.paymentStatus
                    })
                } else if (registration.paymentStatus === 'paid_awaiting_verification') {
                    setError('Payment already submitted. Awaiting admin verification.')
                } else if (registration.paymentStatus === 'verified' || registration.paymentStatus === 'completed') {
                    setError('Payment already completed for this registration.')
                } else {
                    setError('Invalid payment status.')
                }

            } catch (err) {
                console.error('Error fetching registration:', err)
                setError(err.message || 'Failed to load registration details')
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchRegistration()
        } else {
            setError('Invalid registration ID')
            setLoading(false)
        }
    }, [id])

    const handlePaymentComplete = (updatedData) => {
        setRegistrationData(updatedData)
        setPaymentComplete(true)
    }

    const handleBackToHome = () => {
        navigate('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-black px-4">
                <div className="w-full max-w-lg bg-[#1a1a1a] rounded-2xl p-8 border border-gray-700">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-white text-lg">Loading registration details...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-black px-4">
                <div className="w-full max-w-lg bg-[#1a1a1a] rounded-2xl p-8 border border-gray-700">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
                        <p className="text-gray-400 mb-6">{error}</p>
                        <button
                            onClick={handleBackToHome}
                            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-full text-base font-semibold transition-colors"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (paymentComplete) {
        return (
            <PaymentSuccess
                registrationData={registrationData}
                onStartOver={handleBackToHome}
            />
        )
    }

    if (registrationData) {
        return (
            <PaymentForm
                registrationData={registrationData}
                onPaymentComplete={handlePaymentComplete}
            />
        )
    }

    return null
}

export default PaymentPage
