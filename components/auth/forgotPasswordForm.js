'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'react-toastify'
import { Loader2 } from 'lucide-react'

export default function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [verificationData, setVerificationData] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          redirectUrl: '/aistudio' // Default redirect after password reset
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailSent(true)
        // Store verification data for the next step
        if (data.userId && data.email && data.verificationCode) {
          setVerificationData({
            userId: data.userId,
            email: data.email,
            code: data.verificationCode
          })
        }
        toast.success('Password reset instructions sent to your email')
      } else {
        toast.error(data.error || 'Failed to send reset instructions')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8 border border-gray-700">
        <div className="text-center">
          <Link href={'/'}>
            <Image
              src="/images/small.webp"
              alt="Planet Q Logo"
              width={135}
              height={150}
              className="rounded-2xl mx-auto"
            />
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-white">Forgot Password</h2>
          {!emailSent ? (
            <p className="mt-2 text-sm text-gray-400">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          ) : (
            <p className="mt-2 text-sm text-green-400">
              Check your email for password reset instructions. If you don't see it, check your spam folder.
            </p>
          )}
        </div>

        {!emailSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" /> Sending...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6">
            <button
              onClick={() => {
                // If we have verification data, pass it as URL parameters
                if (verificationData) {
                  router.push(`/reset-password?userId=${verificationData.userId}&email=${encodeURIComponent(verificationData.email)}&code=${verificationData.code}`)
                } else {
                  router.push('/reset-password')
                }
              }}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Continue to Reset Password
            </button>
          </div>
        )}

        <div className="text-center mt-4">
          <Link
            href="/login"
            className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
