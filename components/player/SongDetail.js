'use client'

import React, { useState } from 'react'
import AudioPlayer from './audioPlayer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '../ui/button'

const SongDetail = ({ 
  song, 
  onEditTitle,
  onDeleteSong
}) => {
  // Helper function to check if a song is pending
  const isSongPending = (song) => {
    // Only consider a song pending if it has an explicit pending status
    // This prevents showing the "generating" message for songs without audio URLs
    if (song.status === 'pending') {
      return true
    }
    if (song.tags && song.tags.some(tag => tag === 'status:pending')) {
      return true
    }
    return false
  }
  const [editingSongTitle, setEditingSongTitle] = useState(false)
  const [editedSongTitle, setEditedSongTitle] = useState(song?.title || '')

  // Format date in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString()
  }

  // Start editing the title
  const startEditingTitle = () => {
    setEditedSongTitle(song.title)
    setEditingSongTitle(true)
  }

  // Save the edited title
  const saveEditedTitle = () => {
    if (editedSongTitle.trim() !== '') {
      onEditTitle(editedSongTitle.trim())
      setEditingSongTitle(false)
    }
  }

  // Handle key press events for the title input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEditedTitle()
    } else if (e.key === 'Escape') {
      setEditingSongTitle(false)
      setEditedSongTitle(song.title)
    }
  }

  if (!song) return null

  return (
    <div className="bg-slate-800 p-4 rounded-lg">
      {/* Song title with edit functionality */}
      <div className="mb-3">
        {editingSongTitle ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={editedSongTitle}
              onChange={(e) => setEditedSongTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              className="bg-slate-700 text-white px-2 py-1 rounded flex-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
              autoFocus
            />
            <button 
              onClick={saveEditedTitle}
              className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg">
              {song.title}
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={startEditingTitle}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                Edit Title
              </button>
              {onDeleteSong && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteSong(song.id)}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Audio player or pending indicator */}
      {isSongPending(song) ? (
        <div className="bg-amber-600/20 border border-amber-600/30 rounded-lg p-4 my-3">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
            <div>
              <p className="text-amber-300 font-medium">Your music is being generated</p>
              <p className="text-amber-300/70 text-sm">This may take a few minutes. The song will appear automatically when ready.</p>
            </div>
          </div>
        </div>
      ) : (
        <AudioPlayer src={song.audioUrl} />
      )}
      
      {/* Download button - only show if song is not pending */}
      {!isSongPending(song) && (
        <div className="mt-3 flex justify-end">
          <a 
            href={song.audioUrl} 
            download={`${song.title.replace(/\s+/g, '_')}.mp3`}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>
      )}
      
      {/* Song details */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="text-gray-400">
          <span className="text-gray-500">Style:</span> {song.style || 'Default'}
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">Tempo:</span> {song.tempo || 'Medium'}
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">Mood:</span> {song.mood || 'Neutral'}
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">Created:</span> {formatDate(song.createdAt)}
        </div>
      </div>
      
      {/* Cover image if available */}
      {song.coverImageUrl && (
        <div className="mt-4">
          <h4 className="text-white mb-2 font-semibold">Cover Image:</h4>
          <div className="bg-slate-700/50 p-3 rounded-md">
            <img 
              src={song.coverImageUrl} 
              alt={song.title} 
              className="w-full max-h-48 object-contain rounded-md"
            />
          </div>
        </div>
      )}
      
      {/* Lyrics if available */}
      {song.lyrics && (
        <div className="mt-4">
          <h4 className="text-white mb-2 font-semibold">Lyrics:</h4>
          <div className="bg-slate-700/50 p-3 rounded-md text-gray-300 whitespace-pre-line overflow-y-auto max-h-60">
            {song.lyrics}
          </div>
        </div>
      )}
    </div>
  )
}

export default SongDetail
