'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, CheckCircle, ArrowLeft, Gift } from 'lucide-react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function OnboardPage() {
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [walletCreated, setWalletCreated] = useState(false)
  const [email, setEmail] = useState('')
  const [txId, setTxId] = useState('')

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
      handleOnboard(tokenParam)
    }
  }, [searchParams])

  const handleOnboard = async (tokenValue: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/api/onboard`, {
        token: tokenValue
      })

      if (response.data.success) {
        setEmail(response.data.email)
        setTxId(response.data.txId)
        
        if (response.data.alreadyExists) {
          // Wallet already exists, redirect to verify
          window.location.href = `/verify?email=${encodeURIComponent(response.data.email)}`
        } else {
          setWalletCreated(true)
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Onboarding failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2">
          <Mail className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">EmailPay</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Setting up your wallet...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">❌</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Onboarding Failed
                </h3>
                <p className="text-red-600 mb-6">{error}</p>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go to Home
                </a>
              </div>
            ) : walletCreated ? (
              <div className="text-center">
                <Gift className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  You Have a Pending Payment!
                </h3>
                <p className="text-gray-600 mb-6">
                  We've created your EmailPay wallet. Please check your email for the verification code.
                </p>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong> {email}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    After verification, your pending payment will be automatically processed.
                  </p>
                </div>

                <button
                  onClick={() => window.location.href = `/verify?email=${encodeURIComponent(email)}`}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Verify Now
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Invalid or expired onboarding link.</p>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go to Home
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
