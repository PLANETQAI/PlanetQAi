// app/video-player/generator/page.jsx
'use client'

import GlobalHeader from '@/components/planetqproductioncomp/GlobalHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mic, Speaker } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import NewImageGenerator from './_components/NewImageGenerator'
import NewVideoGenerator from './_components/NewVideoGenerator'

export default function VideoGeneratorPage() {
  const { data: session, status } = useSession()
  const videoRef = useRef(null);
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('video')
  const [isPlaying, setIsPlaying] = useState(false);


  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (videoRef.current.ended) {
      videoRef.current.currentTime = 0;
    }
    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(error => console.error('Error playing video:', error));
    } else {
      videoRef.current.pause();
      // Update state after the video is actually paused
      setTimeout(() => setIsPlaying(videoRef.current && !videoRef.current.paused), 0);
    }
  };

  // Handle keyboard events for better accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    const video = videoRef.current;
    if (!video) return;

  
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?redirectTo=/video-player/generator')
    return null
  }

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <> 
    <GlobalHeader session={session} />
      <div className="min-h-screen  text-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            PlanetQ AI Media Generator
          </h1>

          <div className="relative mb-8">
            <div
              className="absolute inset-0 rounded-full transition-all duration-300"
              style={{
                background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)',
                transform: 'scale(1.2)'
              }}
            />

            <div
              className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-purple-500/30 mx-auto cursor-pointer"
              style={{
                background: 'radial-gradient(circle at center, rgba(30,30,60,0.9), rgba(10,10,30,0.95))',
                boxShadow: '0 0 30px rgba(0,212,255,0.3), inset 0 0 20px rgba(0,100,150,0.2)'
              }}
              onClick={() => router.push('/chat')}
            >
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
                onEnded={() => videoRef.current?.pause()}
                tabIndex="0"
              >
                <source src="/videos/aistudio.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                <button
                  onClick={togglePlayPause}
                  className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg transition-all duration-300"
                  style={{
                    background: !isPlaying
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : '#EF4444',
                    boxShadow: !isPlaying
                      ? '0 4px 15px rgba(16, 185, 129, 0.5)'
                      : '0 4px 15px rgba(239, 68, 68, 0.5)'
                  }}
                  aria-label={!isPlaying ? 'Play' : 'Pause'}
                >
                  {isPlaying && (
                    <div className="absolute inset-0 rounded-full opacity-20 bg-red-400 animate-ping"></div>
                  )}
                  <div className="flex items-center justify-center w-full h-full">
                    {!isPlaying ? (
                      <Mic className="w-6 h-6 text-white" />
                    ) : (
                      <Speaker className="w-6 h-6 text-white" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full mt-4"
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
                <div className=" rounded-xl p-4 md:p-6 border border-gray-700/50">
                  <NewVideoGenerator />
                </div>
            </TabsContent>

            <TabsContent value="image" className="mt-0">
              <div className=" rounded-xl p-4 md:p-6 border border-gray-700/50">
                <NewImageGenerator />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}