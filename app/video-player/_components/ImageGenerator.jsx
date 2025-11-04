// app/video-player/_components/ImageGenerator.jsx
'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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

    setLoading(true)
    setGeneratedImage(null)

    try {
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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
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
          <label className="block text-sm font-medium mb-2">Image Description *</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            rows={3}
            disabled={loading}
            className="bg-gray-700/50 border-gray-600 focus:border-purple-500 focus:ring-purple-500"
          />
        
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Style</label>
            <Select value={style} onValueChange={setStyle} disabled={loading}>
              <SelectTrigger className="bg-gray-700/50 border-gray-600">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {styleOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="hover:bg-gray-700"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quality</label>
            <Select value={quality} onValueChange={setQuality} disabled={loading}>
              <SelectTrigger className="bg-gray-700/50 border-gray-600">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {qualityOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="hover:bg-gray-700"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleGenerateImage}
          disabled={loading || !prompt.trim()}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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