'use client';

import { X } from 'lucide-react';

export default function MediaPreviewModal({ media, onClose }) {
  if (!media) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-900/95 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-4xl mx-2 sm:mx-4 backdrop-blur-xl relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          aria-label="Close preview"
        >
          <X className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Media content */}
        <div className="relative w-full aspect-video max-h-[80vh] rounded-lg overflow-hidden bg-black">
          {media.mediaType === 'video' ? (
            <video
              src={media.fileUrl}
              className="w-full h-full object-contain"
              controls
              autoPlay
              poster={media.thumbnailUrl}
            />
          ) : (
            <img
              src={media.fileUrl}
              alt={media.title || 'Preview'}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Media info */}
        <div className="mt-4">
          <h3 className="text-lg font-medium text-white">{media.title || 'Untitled'}</h3>
          {media.description && (
            <p className="text-sm text-gray-300 mt-1">{media.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
