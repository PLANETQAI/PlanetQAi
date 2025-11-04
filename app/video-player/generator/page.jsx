// app/video-player/generator/page.jsx
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ImageGenerator from '../_components/ImageGenerator'
import VideoGenerator from '../_components/VideoGenerator'

export default function VideoGeneratorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('video')

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?redirectTo=/video-player/generator')
    return null
  }

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          AI Media Generator
        </h1>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger 
              value="video" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
            >
              <span className="h-2 w-2 rounded-full bg-purple-500"></span>
              Video Generator
            </TabsTrigger>
            <TabsTrigger 
              value="image" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400"
            >
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Image Generator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="mt-0">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50">
              <VideoGenerator session={session} />
            </div>
          </TabsContent>

          <TabsContent value="image" className="mt-0">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50">
              <ImageGenerator session={session} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}