'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, Wallet, ArrowLeft, ExternalLink, Copy, CheckCircle } from 'lucide-react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function WalletPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [walletInfo, setWalletInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
      fetchWalletInfo(emailParam)
    }
  }, [searchParams])

  const fetchWalletInfo = async (emailValue: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await axios.get(`${API_URL}/api/wallet/${encodeURIComponent(emailValue)}`)
      setWalletInfo(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch wallet info')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchWalletInfo(email)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        <div className="max-w-2xl mx-auto">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Wallet className="w-7 h-7" />
              Wallet Info
            </h2>

            {!walletInfo ? (
              <form onSubmit={handleSubmit}>
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'View Wallet'}
                </button>
              </form>
            ) : (
              <div>
                {/* Wallet Status */}
                <div className="mb-6 flex items-center gap-2">
                  {walletInfo.verified ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 font-medium">Verified</span>
                    </>
                  ) : (
                    <>
                      <span className="w-5 h-5 text-yellow-500">⚠️</span>
                      <span className="text-yellow-700 font-medium">Not Verified</span>
                    </>
                  )}
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* ETH Balance */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <p className="text-xs opacity-90 mb-1">ETH Balance</p>
                    <p className="text-2xl font-bold mb-1">
                      {walletInfo.balances?.eth || '0'}
                    </p>
                    <p className="text-xs opacity-90">Sepolia ETH</p>
                  </div>
                  
                  {/* PYUSD Balance */}
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <p className="text-xs opacity-90 mb-1">PYUSD Balance</p>
                    <p className="text-2xl font-bold mb-1">
                      {walletInfo.balances?.pyusd || walletInfo.balance || '0'}
                    </p>
                    <p className="text-xs opacity-90">PYUSD</p>
                  </div>
                </div>

                {/* Wallet Details */}
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-gray-900 break-all flex-1">
                        {walletInfo.email}
                      </p>
                      <button
                        onClick={() => copyToClipboard(walletInfo.email)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy email"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Wallet Address</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-gray-900 break-all flex-1">
                        {walletInfo.address}
                      </p>
                      <button
                        onClick={() => copyToClipboard(walletInfo.address)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy address"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      <a
                        href={`https://sepolia.etherscan.io/address/${walletInfo.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View on Etherscan"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                      </a>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Network</p>
                    <p className="text-gray-900">Ethereum Sepolia (Testnet)</p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Send Payments via Email</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Send an email to <strong>send@yourdomain.com</strong> with:
                  </p>
                  <code className="block bg-white px-3 py-2 rounded text-sm text-gray-900 border border-gray-200 mb-2">
                    SEND 10 PYUSD TO recipient@example.com
                  </code>
                  <p className="text-xs text-gray-600">
                    You'll receive a confirmation email with the transaction details.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setWalletInfo(null)
                    setEmail('')
                  }}
                  className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Check Another Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
