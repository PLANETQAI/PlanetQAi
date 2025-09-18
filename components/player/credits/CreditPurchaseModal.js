'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
// Using _ prefix for unused imports
import { 
  Dialog as _Dialog, 
  DialogContent as _DialogContent, 
  DialogHeader as _DialogHeader, 
  DialogTitle as _DialogTitle,
  DialogDescription as _DialogDescription,
  DialogFooter as _DialogFooter
} from '@/components/ui/dialog'
import { Button as _Button } from '@/components/ui/button'
import { 
  Zap as _Zap, 
  Package as _Package, 
  CheckCircle as _CheckCircle, 
  Loader2 as _Loader2 
} from 'lucide-react'

const CreditPurchaseModal = ({ 
  isOpen, 
  onClose, 
  creditsNeeded = 0,
  onSuccess: _onSuccess = () => {} 
}) => {
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [packages, setPackages] = useState([
    { id: "prod_SNif9JuV1hG0Ux", name: "Small Pack", credits: 100, price: 5 },
    { id: "prod_SNihFWLdp5m3Uj", name: "Medium Pack", credits: 300, price: 12 },
    { id: "prod_SNijf10zShItPz", name: "Large Pack", credits: 700, price: 25 },
    { id: "prod_SNijpow92xtGMW", name: "Extra Large Pack", credits: 1500, price: 45 },
  ])

  // Fetch available credit packages when the modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchCreditPackages()
    }
  }, [isOpen])

  const fetchCreditPackages = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      const response = await fetch(`${apiUrl}/api/credits/purchase`)
      if (response.ok) {
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
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      console.log('Making purchase request to:', `${apiUrl}/api/credits/purchase`)
      const response = await fetch(`${apiUrl}/api/credits/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }
      
      if (data.url) {
        // Store the session ID in localStorage for later verification
        if (data.sessionId) {
          localStorage.setItem('stripeSessionId', data.sessionId)
        }
        
        // Redirect to Stripe checkout
        window.location.href = data.url // Using window.location for a full page redirect
      } else {
        throw new Error('No checkout URL returned from the server')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      setError(error.message || 'Failed to process purchase')
      setLoading(false)
    }
  }

  const getPackageById = (id) => {
    return packages.find(pkg => pkg.id === id) || null
  }

  return (
    <_Dialog open={isOpen} onOpenChange={onClose}>
      <_DialogContent className="sm:max-w-[425px]">
        <_DialogHeader>
          <_DialogTitle className="flex items-center gap-2">
            <_Zap className="w-5 h-5 text-yellow-500" />
            Get More Credits
          </_DialogTitle>
          <_DialogDescription>
            You need {creditsNeeded} more credits to generate this content.
            Choose a package to continue.
          </_DialogDescription>
        </_DialogHeader>

        <div className="grid gap-4 py-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPackage?.id === pkg.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{pkg.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {pkg.credits} credits
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${pkg.price}</p>
                  <p className="text-xs text-muted-foreground">
                    ${(pkg.price / pkg.credits).toFixed(3)} per credit
                  </p>
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
        
        <_DialogFooter>
          <_Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
          >
            Cancel
          </_Button>
          <_Button 
            onClick={handlePurchase}
            disabled={!selectedPackage || loading}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <_Loader2 className="h-4 w-4 animate-spin" />
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
          </_Button>
        </_DialogFooter>
      </_DialogContent>
    </_Dialog>
  )
}

export default CreditPurchaseModal
