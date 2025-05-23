'use client'

import React from 'react'
import { Music, Clock } from 'lucide-react'

const SongList = ({ 
  songs, 
  selectedSongIndex, 
  onSelectSong, 
  generator 
}) => {
  // Format duration in a readable format (mm:ss)
  const formatDuration = (seconds) => {
    if (!seconds) return '~1:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
      {songs.map((song, index) => (
        <div 
          key={`${song.id}-${index}`} 
          className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedSongIndex === index ? 'bg-purple-800 ring-1 ring-purple-500' : 'bg-slate-800 hover:bg-slate-700'}`}
          onClick={() => onSelectSong(index)}
        >
          {/* Song thumbnail */}
          <div className="bg-slate-700 h-12 w-12 rounded-md flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
            {song.coverImageUrl ? (
              <>
              <Music className="w-6 h-6 text-purple-400" />
              {/* <img 
                src={song.coverImageUrl} 
                alt={song.title} 
                className="w-full h-full object-cover"
              /> */}
              </>
             
            ) : (
              <Music className="w-6 h-6 text-purple-400" />
            )}
          </div>
          
          {/* Song info */}
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate">{song.title}</div>
            <div className="text-gray-400 text-xs flex items-center gap-2">
              <span>{song.style || 'Default'}</span>
              <span>•</span>
              <span>{new Date(song.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          {/* Duration */}
          <div className="text-gray-400 text-xs flex items-center gap-1 ml-3">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(song.duration)}</span>
          </div>
          
          {/* Generator badge */}
          <div className="ml-2 px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full">
            {generator === 'diffrhym' ? 'Diffrhym' : 'Suno'}
          </div>
          
          {/* New song indicator */}
          {index === 0 && (
            <div className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
              Latest
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default SongList
