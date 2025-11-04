// app/video-player/components/VideoDetail.jsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDistanceToNow } from 'date-fns'
import { Download, Loader2, Pause, Play, Share2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const VideoDetail = ({ video, onDelete }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(video.title || '')
  const videoRef = useRef(null)

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleDownload = () => {
    if (video.fileUrl) {
      const link = document.createElement('a')
      link.href = video.fileUrl
      link.download = `${video.title || 'untitled'}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/media/${video.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editedTitle.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to update title')
      }

      setIsEditing(false)
      toast.success('Title updated successfully')
    } catch (error) {
      console.error('Error updating title:', error)
      toast.error('Failed to update title')
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title || 'Check out this video',
          text: video.description || 'Created with PlanetQAi',
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  if (!video) return null

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {video.fileUrl ? (
          <>
            <video
              ref={videoRef}
              src={video.fileUrl}
              className="w-full h-full object-cover"
              loop
              onClick={handlePlayPause}
            />
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/20"
            >
              {!isPlaying && (
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="h-8 w-8 text-white" />
                </div>
              )}
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-white/50 animate-spin mx-auto mb-4" />
              <p className="text-white/70">Generating video...</p>
              <p className="text-sm text-white/50 mt-1">
                This may take a few minutes
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between">
          {isEditing ? (
            <div className="flex-1 flex space-x-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleSaveTitle}
                disabled={isSaving || !editedTitle.trim()}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setEditedTitle(video.title || '')
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-semibold">
                  {video.title || 'Untitled Video'}
                </h2>
                <p className="text-sm text-gray-500">
                  Created {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditedTitle(video.title || '')
                  setIsEditing(true)
                }}
              >
                Edit
              </Button>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            disabled={!video.fileUrl}
          >
            {isPlaying ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Play
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!video.fileUrl}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={!video.fileUrl}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        {video.description && (
          <div className="pt-2">
            <h3 className="text-sm font-medium text-gray-700">Description</h3>
            <p className="text-sm text-gray-600 mt-1">{video.description}</p>
          </div>
        )}

        <div className="pt-2">
          <h3 className="text-sm font-medium text-gray-700">Details</h3>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div>
              <p className="text-gray-500">Duration</p>
              <p>{video.duration || 0}s</p>
            </div>
            <div>
              <p className="text-gray-500">Quality</p>
              <p>{video.quality || 'Standard'}</p>
            </div>
            <div>
              <p className="text-gray-500">Style</p>
              <p>{video.style || 'Cinematic'}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <div className="flex items-center">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full mr-2',
                    video.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                  )}
                />
                <span className="capitalize">{video.status || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoDetail