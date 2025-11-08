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


export default function NewImageGenerator() {
   const { data: session, status } = useSession()
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState('');
  const eventSourceRef = useRef(null);
  
  // Credit system
  const { credits: userCredits, fetchUserCredits } = useUser();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const IMAGE_GENERATION_CREDITS = 100; // Cost per image generation

  // Cleanup function
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

    useEffect(() => {   
        fetchUserCredits()
  }, [fetchUserCredits]);

  // Check if user has enough credits
  const hasEnoughCredits = userCredits?.credits >= IMAGE_GENERATION_CREDITS;

  const handleGenerateImage = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error('Please enter a description for the image');
      return;
    }

    // Check credits
    if (!hasEnoughCredits) {
      setShowCreditModal(true);
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setError('');
    setGeneratedImage(null);

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.abort();
    }

    try {
      const controller = new AbortController();
      eventSourceRef.current = controller;

      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to start image generation');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages (ending with double newline)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer
        
        for (const message of messages) {
          if (!message.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(message.slice(6).trim());
            
            if (data.error) {
              throw new Error(data.message || 'An error occurred');
            }
            
            // Update progress
            if (data.progress !== undefined) {
              setProgress(data.progress);
            }
            
            // Handle completion
            if (data.status === 'completed' && data.imageUrl) {
              setGeneratedImage(data.imageUrl);
              setIsGenerating(false);
              fetchUserCredits(); // Refresh credits after successful generation
              toast.success('Image generated successfully!');
              return;
            } else if (data.status === 'failed' || data.status === 'error') {
              throw new Error(data.message || 'Failed to generate image');
            }
          } catch (err) {
            console.error('Error processing message:', err);
            throw err;
          }
        }
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError(error.message || 'Failed to generate image');
      setIsGenerating(false);
      if (!error.message.includes('aborted')) {
        toast.error(error.message || 'Failed to generate image');
      }
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.${outputFormat}`;
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
                    {userCredits.credits || 0} Planet_Q_Coins • {userCredits.error}
                  </span>
                </div>
                <button 
                  onClick={() => setShowCreditModal(true)}
                  className="flex items-center gap-1 bg-yellow-500/80 hover:bg-yellow-500/90 text-yellow-900 text-xs font-medium px-2 py-1 rounded-full transition-colors"
                >
                  <span>Upgrade</span>
                </button>
              </div>
            ) : userCredits.credits !== null ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-700/50 px-3 py-1 rounded-full">
                  <span className="text-white text-sm font-medium">
                    {userCredits.credits.toLocaleString()} Planet_Q_Coins
                  </span>
                </div>
                {userCredits.credits < 100 && (
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

        {/* Image Generation Form */}
        <form onSubmit={handleGenerateImage} className="space-y-4">
          <div>
            <Textarea
              id="prompt"
              placeholder="A beautiful landscape with mountains and a lake at sunset..."
              className="min-h-[120px]"
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
              `Generate Image (${IMAGE_GENERATION_CREDITS} credits)`
            )}
          </Button>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {/* Credit Warning */}
          {!hasEnoughCredits && !isGenerating && (
            <div className="text-sm text-yellow-600 p-3 bg-yellow-50 rounded-md flex items-center justify-between">
              <span>Not enough credits to generate an image</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreditModal(true)}
                className="ml-2"
              >
                Buy Credits
              </Button>
            </div>
          )}
        </form>

        {/* Generated Image */}
        {generatedImage && (
          <div className="mt-6 space-y-4">
            <div className="relative">
              <img
                src={generatedImage}
                alt="Generated content"
                className="w-full h-auto rounded-lg border border-gray-200"
              />
              <Button
                onClick={handleDownload}
                className="absolute bottom-4 right-4"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        )}

        <MediaListComponent session={session} type="image"/>
      </div>

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        open={showCreditModal}
        onOpenChange={setShowCreditModal}
        onSuccess={() => {
          fetchUserCredits();
          setShowCreditModal(false);
        }}
      />
    </div>
  );
}