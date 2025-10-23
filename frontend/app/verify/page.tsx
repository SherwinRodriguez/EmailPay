'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, CheckCircle, ArrowLeft, Wallet, Send } from 'lucide-react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [walletInfo, setWalletInfo] = useState<any>(null)
  const [step, setStep] = useState<'email' | 'otp'>('email') // Two-step process
  const [otpSent, setOtpSent] = useState(false)
  const [showDevOtp, setShowDevOtp] = useState(false)
  const [devOtpCode, setDevOtpCode] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
      setStep('otp') // Go directly to OTP step if email is provided
    }
  }, [searchParams])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/api/wallet/resend-otp`, {
        email
      })

      if (response.data.success) {
        setOtpSent(true)
        setStep('otp')
        
        // Check if OTP is included for development
        if (response.data.otpCode) {
          setDevOtpCode(response.data.otpCode)
          setShowDevOtp(true)
        }
      }
    } catch (err: any) {
      // Check if wallet is already verified
      if (err.response?.data?.alreadyVerified) {
        // Redirect to wallet page
        window.location.href = `/wallet?email=${encodeURIComponent(email)}`
      } else {
        setError(err.response?.data?.error || 'Failed to send OTP')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/api/wallet/verify`, {
        email,
        otpCode
      })

      if (response.data.success) {
        setSuccess(true)
        // Fetch wallet info
        const walletResponse = await axios.get(`${API_URL}/api/wallet/${encodeURIComponent(email)}`)
        setWalletInfo(walletResponse.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/api/wallet/resend-otp`, {
        email
      })
      setError('')
      
      // Check if OTP is included for development
      if (response.data.otpCode) {
        setDevOtpCode(response.data.otpCode)
        setShowDevOtp(true)
        alert(`OTP resent! Development code: ${response.data.otpCode}`)
      } else {
        alert('OTP resent! Check your email.')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2">
          <Mail className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">EmailPay</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Verify Your Wallet
            </h2>

            {success && walletInfo ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Wallet Verified!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your EmailPay wallet is now active.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-mono text-sm text-gray-900 break-all">{walletInfo.email}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Wallet Address</p>
                    <p className="font-mono text-sm text-gray-900 break-all">{walletInfo.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">ETH Balance</p>
                      <p className="font-semibold text-gray-900">
                        {walletInfo.balances?.eth || '0'} ETH
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">PYUSD Balance</p>
                      <p className="font-semibold text-gray-900">
                        {walletInfo.balances?.pyusd || walletInfo.balance || '0'} PYUSD
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">Send Payments via Email</h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Send an email to <strong>emailpay.demotest@gmail.com</strong> with:
                  </p>
                  <code className="block bg-white px-3 py-2 rounded text-sm text-gray-900 border border-gray-200">
                    SEND 10 PYUSD TO recipient@example.com
                  </code>
                </div>

                <button
                  onClick={() => window.location.href = '/wallet'}
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  View Wallet
                </button>
              </div>
            ) : step === 'email' ? (
              <form onSubmit={handleSendOTP}>
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="you@example.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    We'll send a verification code to this email
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('otp')}
                  className="w-full mt-3 text-gray-600 hover:text-gray-800 font-medium py-2 text-sm"
                >
                  Already have a code? Enter it here
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify}>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Verification code sent to:
                  </p>
                  <p className="font-medium text-gray-900 mb-4">{email}</p>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Change email
                  </button>
                </div>

                <div className="mb-6">
                  <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="otpCode"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-mono text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the 6-digit code from your email
                  </p>
                  
                  {showDevOtp && devOtpCode && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-yellow-800 mb-1">
                        🔧 Development Mode
                      </p>
                      <p className="text-xs text-yellow-700 mb-1">
                        Your code: <span className="font-mono font-bold">{devOtpCode}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setOtpCode(devOtpCode)}
                        className="text-xs text-yellow-800 hover:text-yellow-900 underline"
                      >
                        Click to auto-fill
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                >
                  {loading ? 'Verifying...' : 'Verify Wallet'}
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 text-sm disabled:opacity-50"
                >
                  Didn't receive code? Resend
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
