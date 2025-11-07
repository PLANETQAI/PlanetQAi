// app/video-player/_components/ImageGenerator.jsx
'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/context/UserContext'
import { Download, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import MediaListComponent from './MediaList'

const ImageGenerator = ({ session }) => {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [quality, setQuality] = useState('standard')
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [creditCheck, setCreditCheck] = useState({
    loading: false,
    error: null,
    credits: null
  });
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);
  const { fetchUserCredits } = useUser();
  const styleOptions = [
    { value: 'realistic', label: 'Realistic' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'anime', label: 'Anime' },
    { value: 'painting', label: 'Painting' },
    { value: 'digital-art', label: 'Digital Art' },
  ]

  const qualityOptions = [
    { value: 'standard', label: 'Standard (1024x1024)' },
    { value: 'hd', label: 'High Quality (1792x1024)' },
  ]

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for the image')
      return
    }

    setLoading(true);
    setGeneratedImage(null);
    
    try {
      setCreditCheck(prev => ({ ...prev, loading: true, error: null }));
      const credits = await fetchUserCredits();
      
      if (!credits || credits.credits < 100) {
        setCreditCheck({
          loading: false,
          error: 'Insufficient credits',
          credits: credits?.credits || 0
        });
        setLoading(false);
        return;
      }
      
      setCreditCheck(prev => ({
        ...prev,
        loading: false,
        error: null,
        credits: credits.credits
      }));

      // Proceed with image generation if we have enough credits
      const response = await fetch('/api/media/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          style,
          quality,
          mediaType: 'image'
        }),
      })

      const data = await response.json();

      if (!response.ok) {
        // Show detailed error message in an alert
        const errorMessage = data.details || data.error || 'Failed to generate image';
        alert(`Error: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      setGeneratedImage(data.url)
      toast.success('Image generated successfully!')
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error(error.message || 'Failed to generate image')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            rows={6}
            disabled={loading}
            className="bg-gray-700/50 border-gray-600 focus:border-purple-500 focus:ring-purple-500"
          />
        
        </div>

      </div>

      <div className="w-full space-y-4">
        <div className="flex justify-between items-center">
          {creditCheck.loading ? (
            <div className="flex items-center gap-2 bg-slate-700/30 px-3 py-1 rounded-full">
              <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
              <span className="text-blue-300 text-sm font-medium">Loading credits...</span>
            </div>
          ) : creditCheck.error ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-red-500/20 px-3 py-1 rounded-full">
                <span className="text-red-300 text-sm font-medium">
                  {creditCheck.credits} Planet_Q_Coins • {creditCheck.error}
                </span>
              </div>
              <button 
                onClick={() => setShowCreditPurchaseModal(true)}
                className="flex items-center gap-1 bg-yellow-500/80 hover:bg-yellow-500/90 text-yellow-900 text-xs font-medium px-2 py-1 rounded-full transition-colors"
              >
                <span>Upgrade</span>
              </button>
            </div>
          ) : creditCheck.credits !== null ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-700/50 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">
                  {creditCheck.credits.toLocaleString()} Planet_Q_Coins
                </span>
              </div>
              {creditCheck.credits < 100 && (
                <button 
                  onClick={() => setShowCreditPurchaseModal(true)}
                  className="flex items-center gap-1 bg-yellow-500/80 hover:bg-yellow-500/90 text-yellow-900 text-xs font-medium px-2 py-1 rounded-full transition-colors"
                >
                  <span>Upgrade</span>
                </button>
              )}
            </div>
          ) : null}
        </div>
        
        <Button
          onClick={handleGenerateImage}
          disabled={loading || !prompt.trim() || creditCheck.loading || (creditCheck.credits !== null && creditCheck.credits < 100)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full py-4"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Image
            </>
          )}
        </Button>
      </div>

      {generatedImage && (
        <div className="mt-8 space-y-4">
          <div className="relative group">
            <div className="relative rounded-lg overflow-hidden bg-gray-800/50 border border-gray-700/50">
              <img
                src={generatedImage}
                alt={prompt}
                className="w-full h-auto rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <Button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = generatedImage
                    link.download = `ai-image-${Date.now()}.png`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <MediaListComponent session={session} type="image"/>
    </div>
  )
}

export default ImageGenerator