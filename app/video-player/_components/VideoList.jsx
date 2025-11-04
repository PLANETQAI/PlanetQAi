// app/video-player/components/VideoList.jsx
'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Trash2, Video } from 'lucide-react'
import { useState } from 'react'

const VideoList = ({ videos = [], selectedIndex, onSelect, onDelete }) => {
  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (e, videoId) => {
    e.stopPropagation()
    setDeletingId(videoId)
    try {
      await onDelete(videoId)
    } finally {
      setDeletingId(null)
    }
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Video className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2">No videos generated yet</p>
        <p className="text-sm text-gray-400">Create your first video to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm text-gray-500 mb-2">YOUR VIDEOS</h3>
      <div className="space-y-1">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50',
              selectedIndex === index && 'bg-blue-50 border border-blue-100'
            )}
            onClick={() => onSelect(index)}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                  <Video className="h-5 w-5 text-gray-400" />
                </div>
                {video.status === 'processing' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {video.title || 'Untitled Video'}
                </p>
                <p className="text-xs text-gray-500">
                  {video.duration}s • {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => handleDelete(e, video.id)}
              disabled={deletingId === video.id}
            >
              {deletingId === video.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default VideoList