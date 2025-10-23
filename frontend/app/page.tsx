'use client'

import { useState } from 'react'
import { Mail, Wallet, ArrowRight, CheckCircle, Shield, Zap } from 'lucide-react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [showDevOtp, setShowDevOtp] = useState(false)

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await axios.post(`${API_URL}/api/wallet/create`, { email })
      
      if (response.data.success) {
        setSuccess(true)
        
        // Check if OTP is included for development
        if (response.data.otpCode) {
          setOtpCode(response.data.otpCode)
          setShowDevOtp(true)
        }
        
        // Redirect to verify page after 3 seconds (longer if showing OTP)
        setTimeout(() => {
          window.location.href = `/verify?email=${encodeURIComponent(email)}`
        }, showDevOtp || response.data.otpCode ? 5000 : 2000)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create wallet')
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

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Send PYUSD via Email
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Your email is your wallet. Send payments as easily as sending an email.
          </p>
          
          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <Wallet className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Email = Wallet</h3>
              <p className="text-sm text-gray-600">
                Every email address becomes a PKP wallet after verification
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <Zap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Email Commands</h3>
              <p className="text-sm text-gray-600">
                Send payments by emailing simple commands
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Secure & Simple</h3>
              <p className="text-sm text-gray-600">
                Policy-bound PKP wallets with no private keys stored
              </p>
            </div>
          </div>

          {/* Create Wallet Form */}
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Your Wallet</h3>
            
            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Wallet Created!
                </p>
                <p className="text-gray-600 mb-4">
                  Check your email for the verification code.
                </p>
                
                {showDevOtp && otpCode && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">
                      🔧 Development Mode - Test Email Detected
                    </p>
                    <p className="text-xs text-yellow-700 mb-2">
                      Your verification code (since this is a test email):
                    </p>
                    <p className="text-2xl font-mono font-bold text-yellow-900 tracking-wider">
                      {otpCode}
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      Redirecting to verification page...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCreateWallet}>
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
                  {loading ? 'Creating...' : 'Create Wallet'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Already have a wallet?{' '}
                <a href="/verify" className="text-blue-600 hover:text-blue-700 font-medium">
                  Verify here
                </a>
              </p>
            </div>
          </div>

          {/* How it Works */}
          <div className="mt-16 text-left max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Create & Verify Your Wallet</h4>
                  <p className="text-gray-600">Enter your email and verify with the OTP code sent to you.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Send Payment via Email</h4>
                  <p className="text-gray-600">Email: <code className="bg-gray-100 px-2 py-1 rounded text-sm">SEND 10 PYUSD TO recipient@example.com</code></p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Get Confirmation</h4>
                  <p className="text-gray-600">Receive email confirmation with transaction hash and explorer link.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p className="text-sm">
          EmailPay - PYUSD on Ethereum Sepolia • Powered by Lit Protocol PKP Wallets
        </p>
      </footer>
    </div>
  )
}
