'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, CreditCard, Clock, AlertCircle, TrendingUp } from 'lucide-react'

const CreditDisplay = ({ session }) => {
  const router = useRouter()
  const [creditInfo, setCreditInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (session?.user) {
      fetchCreditInfo()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchCreditInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/music/credits')
      
      if (!response.ok) {
        throw new Error('Failed to fetch credit information')
      }
      
      const data = await response.json()
      setCreditInfo(data)
    } catch (error) {
      console.error('Error fetching credit info:', error)
      setError('Unable to load your credit information')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="p-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Music Generation Credits</h3>
        </div>
        <div className="p-3 bg-slate-700/50 rounded-lg text-center">
          <p className="text-gray-300 text-sm">Sign in to view your credits</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Music Generation Credits</h3>
        </div>
        <div className="flex justify-center items-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Music Generation Credits</h3>
        </div>
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-300">
            <AlertCircle size={18} />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Music Generation Credits</h3>
        <div className="flex items-center gap-1 bg-slate-700/50 px-2 py-1 rounded-full">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-white text-sm font-medium">{creditInfo?.credits || 0}</span>
        </div>
      </div>

      {/* Credit information */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-md">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span className="text-gray-300 text-sm">Current Plan</span>
          </div>
          <span className="text-white text-sm font-medium">
            {creditInfo?.subscription?.planName || creditInfo?.role || 'Basic'}
          </span>
        </div>

        <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-md">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300 text-sm">Monthly Limit</span>
          </div>
          <span className="text-white text-sm font-medium">
            {creditInfo?.maxMonthlyCredits || 0} credits
          </span>
        </div>

        <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-md">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-gray-300 text-sm">Total Used</span>
          </div>
          <span className="text-white text-sm font-medium">
            {creditInfo?.totalCreditsUsed || 0} credits
          </span>
        </div>

        {creditInfo?.subscription?.currentPeriodEnd && (
          <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-md">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300 text-sm">Renews On</span>
            </div>
            <span className="text-white text-sm font-medium">
              {new Date(creditInfo.subscription.currentPeriodEnd).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Get more credits button */}
      <button
        onClick={() => router.push('/payment')}
        className="mt-4 w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors text-sm font-medium"
      >
        Get More Credits
      </button>

      {/* Recent usage */}
      {creditInfo?.creditLogs && creditInfo.creditLogs.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Activity</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {creditInfo.creditLogs.map((log, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-slate-700/20 rounded-md">
                <span className="text-gray-300 text-xs truncate max-w-[70%]">{log.description}</span>
                <span className={`text-xs font-medium ${log.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {log.amount > 0 ? '+' : ''}{log.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CreditDisplay
