// app/video-player/_components/NewVideoGenerator.jsx
'use client';

import CreditPurchaseModal from '@/components/credits/CreditPurchaseModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/context/UserContext';
import { Download, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import MediaListComponent from './MediaList';

export default function NewVideoGenerator() {
  const { data: session, status } = useSession();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [error, setError] = useState('');
  const eventSourceRef = useRef(null);
  
  // Credit system
  const { credits: userCredits, fetchUserCredits } = useUser();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const VIDEO_GENERATION_CREDITS = 400; // Higher cost for video generation

  // Cleanup function
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {   
    fetchUserCredits();
  }, [fetchUserCredits]);

  // Check if user has enough credits
  const hasEnoughCredits = userCredits?.credits.normal >= VIDEO_GENERATION_CREDITS;

const handleGenerateVideo = async (e) => {
  e.preventDefault();
  console.log('[VideoGen] Form submitted, starting video generation...');
  
  if (!prompt.trim()) {
    const errorMsg = 'No prompt provided';
    console.error('[VideoGen] Error:', errorMsg);
    toast.error('Please enter a description for the video');
    return;
  }

  // Check credits
  if (!hasEnoughCredits) {
    console.log('[VideoGen] Insufficient credits, showing credit modal');
    setShowCreditModal(true);
    return;
  }

  console.log('[VideoGen] Initializing video generation state');
  setIsGenerating(true);
  setProgress(0);
  setError('');
  setGeneratedVideo(null);

  // Close any existing connection
  if (eventSourceRef.current) {
    console.log('[VideoGen] Closing existing connection');
    eventSourceRef.current.abort();
  }

  try {
    console.log('[VideoGen] Creating new AbortController');
    const controller = new AbortController();
    eventSourceRef.current = controller;

    const requestBody = {
      prompt,
    };
    console.log('[VideoGen] Sending request to /api/videos/generate with body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('/api/videos/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    console.log(`[VideoGen] Received response status: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMsg = error.message || 'Failed to start video generation';
      console.error('[VideoGen] API Error:', { status: response.status, error });
      throw new Error(errorMsg);
    }

    if (!response.body) {
      const errorMsg = 'No response body received';
      console.error('[VideoGen] Error:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('[VideoGen] Starting to read response stream');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      console.log('[VideoGen] Waiting for next chunk...');
      const { done, value } = await reader.read();
      console.log(`[VideoGen] Received chunk:`, { done, value: value ? `[${value.length} bytes]` : 'null' });
      
      if (done) {
        console.log('[VideoGen] Stream completed');
        break;
      }

      // Decode the chunk and add to buffer
      const chunk = decoder.decode(value, { stream: true });
      console.log(`[VideoGen] Decoded chunk:`, chunk);
      buffer += chunk;
      
      // Process complete SSE messages
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || '';
      console.log(`[VideoGen] Processed ${messages.length} complete messages, buffer length: ${buffer.length}`);
      
      for (const message of messages) {
        if (!message.startsWith('data: ')) {
          console.log('[VideoGen] Skipping non-data message:', message);
          continue;
        }
        
        try {
          const rawData = message.slice(6).trim();
          console.log('[VideoGen] Parsing message:', rawData);
          const data = JSON.parse(rawData);
          console.log('[VideoGen] Parsed message data:', data);
          
          if (data.error) {
            const errorMsg = data.message || 'An error occurred';
            console.error('[VideoGen] Error in message:', { error: data.error, message: errorMsg });
            throw new Error(errorMsg);
          }
          
          // Update progress
          if (data.progress !== undefined) {
            console.log(`[VideoGen] Progress update: ${data.progress}%`);
            setProgress(data.progress);
          }
          
          // Handle completion
          if (data.status === 'completed' && data.videoUrl) {
            console.log('[VideoGen] Video generation completed:', { videoUrl: data.videoUrl });
            setGeneratedVideo(data.videoUrl);
            setIsGenerating(false);
            console.log('[VideoGen] Refreshing user credits');
            fetchUserCredits();
            toast.success('Video generated successfully!');
            return;
          } else if (data.status === 'failed' || data.status === 'error') {
            const errorMsg = data.message || 'Failed to generate video';
            console.error('[VideoGen] Generation failed:', { status: data.status, message: errorMsg });
            throw new Error(errorMsg);
          } else {
            console.log('[VideoGen] Received status update:', { status: data.status, progress: data.progress });
          }
        } catch (err) {
          console.error('[VideoGen] Error processing message:', { message, error: err });
          throw err;
        }
      }
    }
  } catch (error) {
    console.error('[VideoGen] Error in video generation:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    setError(error.message || 'Failed to generate video');
    setIsGenerating(false);
    if (!error.message.includes('aborted')) {
      console.error('[VideoGen] Showing error to user:', error.message);
      toast.error(error.message || 'Failed to generate video');
    }
  } finally {
    console.log('[VideoGen] Video generation process completed');
  }
};

  const handleDownload = () => {
    if (!generatedVideo) return;
    
    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = `generated-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Credit Info */}
      <div className="w-full space-y-4">
        <div className="flex justify-end items-end">
          {!userCredits ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full">
              <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
              <span className="text-blue-300 text-sm font-medium">Loading credits...</span>
            </div>
          ) : userCredits.error ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-red-500/20 px-3 py-1 rounded-full">
                <span className="text-red-300 text-sm font-medium">
                  {userCredits.credits?.normal || 0} Planet_Q_Coins • {userCredits.error}
                </span>
              </div>
              <button 
                onClick={() => setShowCreditModal(true)}
                className="flex items-center gap-1 bg-yellow-500/80 hover:bg-yellow-500/90 text-yellow-900 text-xs font-medium px-2 py-1 rounded-full transition-colors"
              >
                <span>Upgrade</span>
              </button>
            </div>
          ) : userCredits.credits?.normal !== null ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-700/50 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">
                  {userCredits.credits?.normal.toLocaleString()} Planet_Q_Coins
                </span>
              </div>
              {userCredits.credits?.normal < VIDEO_GENERATION_CREDITS && (
                <button 
                  onClick={() => setShowCreditModal(true)}
                  className="flex items-center gap-1 bg-yellow-500/80 hover:bg-yellow-500/90 text-yellow-900 text-xs font-medium px-2 py-1 rounded-full transition-colors"
                >
                  <span>Upgrade</span>
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Video Generation Form */}
        <form onSubmit={handleGenerateVideo} className="space-y-4">
          <div>
            <Textarea
              id="prompt"
              placeholder="A beautiful landscape with mountains and a lake at sunset, cinematic, 8K"
              className="min-h-[120px] text-white"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              row={6}
            />
          </div>

          {/* Generate Button */}
          <Button
            type="submit"
            disabled={isGenerating || !hasEnoughCredits}
            className="w-full p-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-bold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating... ({progress}%)
              </>
            ) : (
              `Generate Video (${VIDEO_GENERATION_CREDITS} credits)`
            )}
          </Button>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md">
              {error}
            </div>
          )}
        </form>

        {/* Generated Video Preview */}
        {generatedVideo && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium">Generated Video:</h3>
            <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
              <video
                src={generatedVideo}
                controls
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Error loading video:', e);
                  toast.error('Failed to load video preview');
                }}
              />
            </div>
            <div className="flex justify-center">
              <Button
                onClick={handleDownload}
                className="mt-2"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" /> Download Video
              </Button>
            </div>
          </div>
        )}

        {/* Media List */}
        <MediaListComponent session={session} type="video" />
      </div>

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
      />
    </div>
  );
}