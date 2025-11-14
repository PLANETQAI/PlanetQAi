'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ShareModal({ 
  isOpen, 
  onClose, 
  media = [], 
  onShare,
  shareLink: externalShareLink,
  onCopyLink
}) {
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [email, setEmail] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const copyTimeoutRef = useRef(null);
  const [shareLink, setShareLink] = useState('');

  // Update share link when media changes
  useEffect(() => {
    if (media && media.length > 0) {
      const firstMedia = media[0];
      const mediaId = firstMedia?.id || firstMedia?.mediaId || firstMedia?._id;
      
      if (mediaId) {
        const newLink = `${window.location.origin}/share/${mediaId}/media`;
        console.log('Updating share link to:', newLink);
        setShareLink(newLink);
      } else {
        console.warn('No valid media ID found in media item:', firstMedia);
      }
    } else {
      console.warn('No media items available');
      setShareLink('');
    }
  }, [media]);

  // Auto-select first media item when modal opens
  useEffect(() => {
    if (media.length > 0 && selectedMedia.length === 0) {
      const firstMediaId = media[0]?.id;
      if (firstMediaId) {
        setSelectedMedia([firstMediaId]);
        // Trigger share immediately
        if (onShare) {
          onShare([firstMediaId], '')
            .then(link => {
              if (link) setShareLink(link);
            })
            .catch(console.error);
        }
      }
    }
  }, [media, onShare]);



  const handleShare = async (mediaIds = selectedMedia, recipientEmail = email) => {
    if (onShare && mediaIds.length > 0) {
      try {
        const shareableLink = await onShare(mediaIds, recipientEmail);
        if (shareableLink) {
          setShareLink(shareableLink);
          return shareableLink;
        }
      } catch (error) {
        console.error('Error sharing media:', error);
        toast.error('Failed to generate share link');
        throw error;
      }
    }
    return null;
  };

  const handleCopyLink = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    if (!shareLink) {
      toast.error('No shareable link available');
      return;
    }
    
    try {
      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      
      // Use both modern and fallback copy methods
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        // Fallback for browsers that don't support the Clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = linkToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      
      setIsLinkCopied(true);
      toast.success('Link copied to clipboard!');
      
      if (onCopyLink) {
        onCopyLink(linkToCopy);
      }
      
      // Reset the copied state after 3 seconds
      copyTimeoutRef.current = setTimeout(() => {
        setIsLinkCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link to clipboard');
    }
    return false;
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md p-6 relative text-gray-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-white">Share Media</h2>

        {media.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-3 text-gray-200">Select media to share:</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto p-2 bg-gray-800/50 rounded-lg">
              {media.map(item => (
                <div key={item.id} className="flex items-center p-2 rounded hover:bg-gray-700/50">
                  <input
                    type="radio"
                    name="media-selection"
                    id={`media-${item.id}`}
                    checked={selectedMedia.includes(item.id)}
                    onChange={() => {
                      setSelectedMedia([item.id]);
                      handleShare([item.id], email);
                    }}
                    className="h-4 w-4 text-blue-500 border-gray-600 bg-gray-700 focus:ring-blue-500"
                  />
                  <label htmlFor={`media-${item.id}`} className="ml-3 block text-sm font-medium text-gray-200 truncate">
                    {item.name || `Media ${item.id}`}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email (optional)
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter email to notify"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {shareLink ? 'Shareable Link' : 'Generate a shareable link'}
          </label>
          <div className="flex">
            <div className="relative w-full flex">
              <div 
                onClick={handleCopyLink}
                className={`flex-1 min-w-0 p-2.5 pr-24 bg-gray-800 border rounded-lg text-sm overflow-hidden ${
                  isLinkCopied 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-gray-700 hover:border-blue-500 cursor-copy'
                }`}
              >
                <div className="truncate text-ellipsis overflow-hidden text-gray-200 w-full">
                  {shareLink || 'Click Share to generate link'}
                </div>
              </div>
              {shareLink && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    isLinkCopied 
                      ? 'bg-green-600 text-white scale-95' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  title={isLinkCopied ? 'Copied!' : 'Copy link'}
                  aria-label={isLinkCopied ? 'Link copied' : 'Copy link to clipboard'}
                >
                  {isLinkCopied ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          {shareLink && (
            <div className="mt-2 flex items-center text-xs text-gray-400">
              <span>Share this link with others to let them view the media</span>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-200 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!selectedMedia.length}
            className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${
              selectedMedia.length
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {shareLink ? 'Update Link' : 'Generate Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
