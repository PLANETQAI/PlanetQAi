'use client'

import { Clock, Music } from 'lucide-react'
import SaleToggleButton from './SaleToggleButton'
import { useState } from 'react'; // Import useState
import SongMediaSelectionDialog from './SongMediaSelectionDialog'; // Import the new dialog

const SongList = ({ 
  songs, 
  selectedSongIndex, 
  onSelectSong, 
  generator,
  onSongUpdated // New prop for updating song in parent
}) => {
  const [isSongMediaSelectionDialogOpen, setIsSongMediaSelectionDialogOpen] = useState(false);
  const [currentSongIdForMediaSelection, setCurrentSongIdForMediaSelection] = useState(null);

  // Helper function to check if a song is pending
  const isSongPending = (song) => {
    // Check if the song has a status tag indicating it's pending
    if (song.tags && song.tags.some(tag => tag === 'status:pending')) {
      return true
    }
    // Check if the song has an empty audioUrl or a status property set to pending
    if (song.status === 'pending') {
      return true
    }
    // For Suno songs, check if song_path exists and is not empty
    if (song.song_path) {
      return false
    }
    // For other songs, check audioUrl
    return !song.audioUrl || song.audioUrl === ''
  }
  // Format duration in a readable format (mm:ss)
  const formatDuration = (seconds) => {
    if (!seconds) return '~1:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handler to open the media selection dialog
  const handleOpenSongMediaSelection = (songId) => {
    setCurrentSongIdForMediaSelection(songId);
    setIsSongMediaSelectionDialogOpen(true);
  };

  // Handler for when media is selected and updated for a song
  const handleSongMediaUpdated = (updatedSong) => {
    if (onSongUpdated) {
      onSongUpdated(updatedSong); // Call parent's update function
    }
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
      {songs.map((song, index) => (
        <div 
          key={`${song.id}-${index}`} 
          className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedSongIndex === index ? 'bg-purple-800 ring-1 ring-purple-500' : 'bg-slate-800 hover:bg-slate-700'}`}
          onClick={() => onSelectSong(index)}
        >
          {/* Song thumbnail */}
          <div
            className="bg-slate-700 h-12 w-12 rounded-md flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // Prevent the song card's onClick from firing
              handleOpenSongMediaSelection(song.id);
            }}
          >
            {song.thumbnailUrl ? ( // Use thumbnailUrl here
              <img
                src={song.thumbnailUrl}
                alt={song.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-6 h-6 text-purple-400" />
            )}
          </div>
          
          {/* Song info */}
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate">{song.title}</div>
            <div className="text-gray-400 text-xs flex items-center gap-2">
              <span>{song.prompt || 'Default'}</span>
              <span>•</span>
              <span>{new Date(song.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div>{/* Duration */} {/* Generator badge */}
          <div className="ml-2 px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full">
            {generator === 'diffrhym' ? 'Q_World Studio' : 'Planet Q AI'}
          </div>
          <div className="text-gray-400 text-xs mt-2 flex items-center gap-1 ml-3">
            <Clock className="w-3 h-3" />
            <span>{song.duration}</span>
          </div>
          
         </div>
          
          
          {/* Pending indicator */}
          {isSongPending(song) && (
            <div className="ml-2 px-2 py-0.5 bg-amber-600 text-white text-xs rounded-full flex items-center">
              <div className="animate-pulse mr-1 h-2 w-2 rounded-full bg-white"></div>
              ..
            </div>
          )}
          
          {/* New song indicator
          {!isSongPending(song) && index === 0 && (
            <div className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full mr-6">
              Latest
            </div>
          )} */}
           <div className="ml-2" onClick={(e) => e.stopPropagation()}>
             <SaleToggleButton 
               songId={song.id}
               isSetForSale={song.isForSale}
               onStatusChange={() => window.location.reload()}
             />
           </div>
        </div>
      ))}
    {/* Song Media Selection Dialog */}
      <SongMediaSelectionDialog
        isOpen={isSongMediaSelectionDialogOpen}
        onClose={() => setIsSongMediaSelectionDialogOpen(false)}
        onSelectMedia={handleSongMediaUpdated}
        songId={currentSongIdForMediaSelection}
      />
    </div>
  )
}

export default SongList
