'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Zap, Package, CheckCircle, Loader2 } from 'lucide-react'

const CreditPurchaseModal = ({ 
  isOpen, 
  onClose, 
  creditsNeeded = 0,
  onSuccess = () => {} 
}) => {
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [packages, setPackages] = useState([
    { id: "prod_SQkShxszzVfSea", name: "Small Pack", credits: 100, price: 5 },
    { id: "prod_SQkSMOMbFVZIqD", name: "Medium Pack", credits: 300, price: 12 },
    { id: "prod_SQkSemW9YYNuto", name: "Large Pack", credits: 700, price: 25 },
    { id: "prod_SQkSmmaeLkOgSY", name: "Extra Large Pack", credits: 1500, price: 45 },
  ])

  // Fetch available credit packages when the modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchCreditPackages()
    }
  }, [isOpen])

  const fetchCreditPackages = async () => {
    try {
      // First check if the user is authenticated by getting the session
      const sessionResponse = await fetch('/api/auth/session')
      const sessionData = await sessionResponse.json()
      
      // If not authenticated, redirect to login page
      if (!sessionData || !sessionData.user) {
        console.log('User not authenticated, redirecting to login')
        window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname)
        return
      }
      
      // Now fetch credit packages with the authenticated session
      const response = await fetch('/api/credits-api', {
        method: 'GET',
        credentials: 'include', // This ensures cookies are sent with the request
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        // If unauthorized, redirect to login
        if (response.status === 401) {
          window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname)
          return
        }
        throw new Error(`Failed to fetch credit packages: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      if (data.packages && data.packages.length > 0) {
        setPackages(data.packages)
        
        // Auto-select the smallest package that covers the needed credits
        if (creditsNeeded > 0) {
          const suitablePackage = data.packages.find(pkg => pkg.credits >= creditsNeeded)
          if (suitablePackage) {
            setSelectedPackage(suitablePackage.id)
          } else {
            setSelectedPackage(data.packages[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching credit packages:', error)
    }
  }

  const handlePurchase = async () => {
    if (!selectedPackage) return
    
    setLoading(true)
    setError(null)
    
    try {
      // First check if the user is authenticated by getting the session
      const sessionResponse = await fetch('/api/auth/session')
      const sessionData = await sessionResponse.json()
      
      // If not authenticated, redirect to login page
      if (!sessionData || !sessionData.user) {
        console.log('User not authenticated, redirecting to login')
        window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname)
        return
      }
      
      // Now process purchase with the authenticated session
      const response = await fetch('/api/credits-api', {
        method: 'POST',
        credentials: 'include', // This ensures cookies are sent with the request
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // If unauthorized, redirect to login
        if (response.status === 401) {
          window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname)
          return
        }
        throw new Error(data.error || 'Failed to create checkout session')
      }
      
      // Check if we got a Stripe checkout URL
      if (data.url) {
        console.log('Redirecting to Stripe checkout:', data.url)
        // Use window.location for a full page redirect to Stripe
        window.location.href = data.url
        return
      }
      
      // Handle direct success (should not happen with Stripe integration)
      if (data.success) {
        onSuccess(data)
        onClose()
      }
    } catch (error) {
      console.error('Purchase error:', error)
      setError(error.message || 'Failed to process purchase')
    } finally {
      setLoading(false)
    }
  }

  const getPackageById = (id) => {
    return packages.find(pkg => pkg.id === id) || null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-slate-800 to-slate-900 text-white border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="text-yellow-400" />
            Purchase Credits
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {creditsNeeded > 0 ? (
              <>You need <span className="font-bold text-yellow-400">{creditsNeeded}</span> more credits to complete this operation.</>
            ) : (
              <>Purchase additional credits to generate more music.</>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 py-4">
          {packages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedPackage === pkg.id 
                  ? 'bg-purple-900/50 border-purple-500' 
                  : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
              }`}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className={`${selectedPackage === pkg.id ? 'text-purple-400' : 'text-gray-400'}`} />
                  <div>
                    <h3 className="font-medium">{pkg.name}</h3>
                    <p className="text-sm text-gray-300">{pkg.credits} credits</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">${pkg.price}</span>
                  {selectedPackage === pkg.id && (
                    <CheckCircle className="text-purple-400" size={18} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 p-2 rounded-md text-sm text-red-300">
            {error}
          </div>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePurchase}
            disabled={!selectedPackage || loading}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Purchase</span>
                {selectedPackage && (
                  <span>${getPackageById(selectedPackage)?.price}</span>
                )}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreditPurchaseModal
