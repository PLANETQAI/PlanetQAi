'use client'

import useFollowing from '@/hooks/useFollowing'
import { Facebook, Heart, MessageCircle, Pause, Play, Repeat, Share2, Shuffle, SkipBack, SkipForward, Trash2, Twitter, UserMinus, UserPlus, Volume2, X } from "lucide-react"
import { useSession } from 'next-auth/react'
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import SaleToggleButton from "./player/SaleToggleButton"
import SongMediaSelectionDialog from "./player/SongMediaSelectionDialog"; // Import the new dialog
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"

const FuturisticMusicPlayer = ({ songs, onShare, userId, isPublic = false, showShareButton = true }) => {
  const [currentSong, setCurrentSong] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const { data: session } = useSession();
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLooping, setIsLooping] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [isLiked, setIsLiked] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedSongs, setSelectedSongs] = useState([])
  const [shareLink, setShareLink] = useState("")
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  const [email, setEmail] = useState("")
  const audioRef = useRef(null)

  const [currentSongs, setCurrentSongs] = useState(songs || [])
  const visualizerRef = useRef(null)

  // State for SongMediaSelectionDialog
  const [isSongMediaSelectionDialogOpen, setIsSongMediaSelectionDialogOpen] = useState(false);
  const [currentSongIdForMediaSelection, setCurrentSongIdForMediaSelection] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const songCreatorId = currentSongs[currentSong]?.User?.id;
  console.log(songCreatorId)

  const { data: followingData, isLoading: isLoadingFollowing, error: followingError, refetch: refetchFollowing } = useFollowing(session?.user?.id, 'following');

  useEffect(() => {
    if (followingData && songCreatorId) {
      setIsFollowing(followingData.some(user => user.id === songCreatorId));
    }
  }, [followingData, songCreatorId]);

  const handleFollowToggle = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in to follow users.");
      return;
    }
    if (session.user.id === songCreatorId) {
      toast.error("You cannot follow yourself.");
      return;
    }

    try {
      const response = await fetch('/api/user/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: songCreatorId }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle follow status');
      }

      const data = await response.json();
      toast.success(data.message);
      setIsFollowing(!isFollowing); // Optimistic UI update
      refetchFollowing(); // Revalidate following data

    } catch (error) {
      console.error("Error toggling follow status:", error);
      toast.error("Failed to update follow status.");
    }
  };

  const currentTrack = currentSongs[currentSong]

  // Handler to open the media selection dialog
  const handleOpenSongMediaSelection = (song) => {
    // If the song doesn't belong to the current user and has a different user's profile picture
    if (session?.user?.id !== song?.userId && song?.User?.profilePictureUrl) {
      setCurrentSongs(prevSongs => {
        const updatedSongs = [...prevSongs];
        const currentSongIndex = updatedSongs.findIndex(s => s.id === song.id);
        if (currentSongIndex !== -1) {
          updatedSongs[currentSongIndex] = {
            ...updatedSongs[currentSongIndex],
            User: {
              ...updatedSongs[currentSongIndex].User,
              profilePictureUrl: song.User.profilePictureUrl
            }
          };
        }
        return updatedSongs;
      });
    }

    setCurrentSongIdForMediaSelection(song.id);
    setIsSongMediaSelectionDialogOpen(true);
  };

  // Handler for when media is selected and updated for a song
  const handleSongMediaUpdated = (updatedSong) => {
    setCurrentSongs(prevSongs =>
      prevSongs.map(song => (song.id === updatedSong.id ? {
        ...song,
        cover: updatedSong.thumbnailUrl || updatedSong.videoUrl, // Update cover based on new media
        thumbnailUrl: updatedSong.thumbnailUrl,
        videoUrl: updatedSong.videoUrl,
      } : song))
    );
    // If the updated song is the current playing song, update its cover immediately
    if (currentTrack.id === updatedSong.id) {
      setCurrentSongs(prevSongs => {
        const newCurrentSongs = [...prevSongs];
        newCurrentSongs[currentSong] = {
          ...newCurrentSongs[currentSong],
          cover: updatedSong.thumbnailUrl || updatedSong.videoUrl,
          thumbnailUrl: updatedSong.thumbnailUrl,
          videoUrl: updatedSong.videoUrl,
        };
        return newCurrentSongs;
      });
    }
  };

  // Audio Controls
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => console.error("Playback error:", e))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping
    }
  }, [isLooping])

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration)
  }

  const handleSongEnd = () => {
    if (!isLooping) {
      handleNext()
    }
  }

  // Delete song functionality
  const deleteSong = async (songId, event) => {
    event.stopPropagation()
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        const updatedSongs = currentSongs.filter((song) => song.id !== songId)
        setCurrentSongs(updatedSongs)
        toast.success('Song deleted successfully')
        // Adjust current song index if necessary
        if (currentSong >= updatedSongs.length) {
          setCurrentSong(Math.max(0, updatedSongs.length - 1))
        }

      }
    } catch (error) {
      console.error('Failed to delete song:', error);
    }
  }

  // Enhanced visualizer animation
  useEffect(() => {
    if (visualizerRef.current && isPlaying) {
      const bars = visualizerRef.current.children
      let animationId

      const animate = () => {
        for (let i = 0; i < bars.length; i++) {
          const height = Math.random() * 50 + 5
          const opacity = Math.random() * 0.5 + 0.5
          bars[i].style.height = `${height}px`
          bars[i].style.opacity = opacity

          // Add random color shifts
          const hue = Math.random() * 60 + 260 // Purple to pink range
          bars[i].style.background = `linear-gradient(to top, hsl(${hue}, 70%, 60%), hsl(${hue + 30}, 70%, 70%))`
        }

        if (isPlaying) {
          animationId = requestAnimationFrame(animate)
        }
      }

      animate()

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
      }
    }
  }, [isPlaying])

  // Set duration when song changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.audioUrl || currentTrack.audio;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing new track:", e));
      }
    }
  }, [currentTrack]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const handlePrevious = () => {
    setCurrentSong((prev) => (prev === 0 ? currentSongs.length - 1 : prev - 1))
  }

  const handleNext = () => {
    if (isShuffling) {
      setCurrentSong(Math.floor(Math.random() * currentSongs.length))
    } else {
      setCurrentSong((prev) => (prev + 1) % currentSongs.length)
    }
  }

  const formatTime = (timeInSeconds) => {
    const seconds = Math.round(timeInSeconds);
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }



  const handleGenerateLink = async (songIds) => {
    console.log("handleGenerateLink called with songIds:", songIds);
    console.log("userId:", userId);
    if (!songIds || songIds.length === 0) {
      console.log("No song IDs provided or songIds is empty.");
      return;
    }

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ songIds, sharedById: userId }),
      });

      const data = await response.json();
      console.log("API response for share link generation:", data);

      if (response.ok) {
        const link = `${window.location.origin}/share/${data.shareableLink}`;
        setShareLink(link);
        console.log("Share link set to:", link);
      } else {
        console.error("Failed to generate share link. Server response:", data);
      }
    } catch (error) {
      console.error("Failed to generate share link:", error);
    }
  };

  const handleSendEmail = async () => {
    console.log("handleSendEmail called.");
    console.log("Email to send to:", email);
    console.log("Share link to send:", shareLink);

    if (!email || !shareLink) {
      console.error("Email or shareLink is missing.");
      return;
    }

    try {
      await fetch("/api/share/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shareableLink: shareLink.split('/').pop(), // Extract the UUID from the full URL
          emails: [email]
        }),
      });
      // Add some user feedback here, e.g., a toast notification
      console.log("Email send request initiated.");
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  const toggleSongSelection = (songId) => {
    setSelectedSongs((prev) => (prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]))
  }

  if (!currentTrack) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No songs available</h2>
          <p className="text-gray-400">Add some songs to start playing</p>
        </div>
      </div>
    )
  }

  // If no songs are available, show a message
  if (!currentSongs || currentSongs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex items-center justify-center p-4 sm:p-6">
        <div className="text-center max-w-md w-full mx-4 sm:mx-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center animate-pulse-slow">
            <Music className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">No songs available</h2>
          <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
            Add some songs to your playlist to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              No Songs Shared
            </h2>
            <p className="text-gray-400 mb-6">There are no songs available to play at the moment.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:opacity-90 transition-all duration-300 transform hover:scale-105"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white overflow-hidden relative">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleSongEnd}
        src={currentTrack.audioUrl || currentTrack.audio}
      />
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAgMEw0MCA0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIi8+CjxwYXRoIGQ9Ik00MCAwTDAgNDAiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIvPgo8L3N2Zz4K')] opacity-30"></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        {/* Main Player */}
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md transform hover:scale-105 transition-all duration-500 animate-float">
          {/* Album Art with Highly Animated Rings */}
          <div className="relative mb-6 sm:mb-8">
            <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 mx-auto rounded-full overflow-hidden relative group">
              {currentTrack?.User?.profilePictureUrl ? (
                <Image
                  src={currentTrack.User.profilePictureUrl}
                  alt={currentTrack.title || 'User profile'}
                  width={320}
                  height={320}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  unoptimized={!currentTrack.User.profilePictureUrl.startsWith('/')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                  <span className="text-4xl font-bold text-white">
                    {currentTrack?.User?.fullName?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              {(!currentTrack.thumbnailUrl && !currentTrack.videoUrl) ? (
                <>
                  {/* Show glowing ring effect only when no media is available */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 animate-spin-slow"></div>
                  <div className="absolute inset-1 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 animate-spin-reverse"></div>
                  <div className="absolute inset-2 sm:inset-3 bg-gradient-to-br from-pink-400 via-blue-400 to-purple-400 animate-spin-slow-2"></div>

                  {/* Pulsing Outer Rings */}
                  <div className="absolute -inset-2 sm:-inset-3 md:-inset-4 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-blue-500/30 rounded-full animate-pulse-ring"></div>
                  <div className="absolute -inset-4 sm:-inset-6 md:-inset-8 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full animate-pulse-ring-delayed"></div>

                  {/* Rotating Particles */}
                  <div className="absolute inset-0 animate-spin-particles">
                    <div className="absolute top-3 sm:top-4 left-1/2 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full animate-ping"></div>
                    <div className="absolute bottom-3 sm:bottom-4 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="absolute top-1/3 right-3 sm:right-4 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-pink-400 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-1/3 left-3 sm:left-4 w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
                  </div>

                  {/* Enhanced Glowing Ring Effects */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 animate-pulse-glow opacity-75 blur-sm"></div>
                  <div className="absolute inset-1 sm:inset-2 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 animate-pulse-glow-delayed opacity-50 blur-md"></div>
                </>
              ) : (
                /* Show media with full size and rounded shape */
                <div className="absolute inset-0 bg-black rounded-full overflow-hidden">
                  {currentTrack.videoUrl ? (
                    <video
                      src={currentTrack.videoUrl}
                      className="w-full h-full object-cover"
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={currentTrack.thumbnailUrl}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20 animate-pulse"></div>
                </div>
              )}

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg animate-bounce-subtle"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ?
                    <Pause className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-black" /> :
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-black ml-0.5 sm:ml-1" />
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Song Info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent animate-glow">
              {currentTrack.title}
            </h2>
            <h3 className="text-2xl font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent animate-glow">
              Created by <span className="font-medium">{currentTrack.User.fullName}</span>
            </h3>
          </div>

          {/* Visualizer */}
          <div className="flex justify-center items-end space-x-1 mb-6 h-16">
            <div ref={visualizerRef} className="flex items-end space-x-1">
              {[...Array(25)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full transition-all duration-200 animate-pulse"
                  style={{
                    height: "10px",
                    animationDelay: `${i * 0.1}s`,
                    filter: "drop-shadow(0 0 3px rgba(139, 92, 246, 0.5))",
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Enhanced Futuristic Controls - Responsive */}
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8 mb-6 sm:mb-8 px-1">
            {/* Shuffle Control - Responsive */}
            <div className="relative">
              <div
                className={`absolute -inset-2 sm:-inset-3 md:-inset-4 rounded-full ${isShuffling ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-600"
                  } blur-md sm:blur-xl opacity-40 animate-pulse`}
              ></div>
              <div
                className={`absolute -inset-1 sm:-inset-2 rounded-full ${isShuffling ? "bg-gradient-to-r from-purple-400 to-pink-400" : "bg-gray-500"
                  } blur-sm sm:blur-lg opacity-60 animate-pulse-delayed`}
              ></div>
              <button
                onClick={() => setIsShuffling(!isShuffling)}
                className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full border-2 sm:border-3 md:border-4 flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 ${isShuffling
                  ? "border-purple-400 bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white shadow-lg sm:shadow-2xl shadow-purple-500/50"
                  : "border-gray-500 bg-black/50 text-gray-400 hover:border-white hover:text-white hover:bg-white/10"
                  }`}
                aria-label={isShuffling ? "Disable shuffle" : "Enable shuffle"}
              >
                <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                {isShuffling && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 sm:border-3 md:border-4 border-purple-400 animate-ping"></div>
                    <div className="absolute inset-1 sm:inset-2 rounded-full border border-pink-400 animate-pulse"></div>
                  </>
                )}
              </button>
            </div>

            {/* Previous Control - Responsive */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gray-600 blur-sm sm:blur-md opacity-30"></div>
              <button
                onClick={handlePrevious}
                className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border border-gray-500 bg-black/50 text-gray-400 hover:border-white hover:text-white hover:bg-white/10 flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 hover:rotate-12"
                aria-label="Previous track"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                <div className="absolute inset-0 rounded-full border border-transparent hover:border-white/20 transition-all duration-300"></div>
              </button>
            </div>

            {/* Main Play/Pause Control - Responsive */}
            <div className="relative mx-1 sm:mx-2">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-md sm:blur-lg opacity-60 animate-pulse"></div>
              <button
                onClick={togglePlay}
                className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-xl sm:shadow-2xl shadow-purple-500/50"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 ml-0.5 sm:ml-1" />
                )}
                <div className="absolute inset-0 rounded-full border-2 sm:border-3 md:border-4 border-white/20 animate-spin-slow"></div>
                <div className="absolute inset-1 sm:inset-2 rounded-full border border-white/10 animate-pulse"></div>
              </button>
            </div>

            {/* Next Control - Responsive */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gray-600 blur-sm sm:blur-md opacity-30"></div>
              <button
                onClick={handleNext}
                className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border border-gray-500 bg-black/50 text-gray-400 hover:border-white hover:text-white hover:bg-white/10 flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 hover:-rotate-12"
                aria-label="Next track"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                <div className="absolute inset-0 rounded-full border border-transparent hover:border-white/20 transition-all duration-300"></div>
              </button>
            </div>

            {/* Repeat Control - Responsive */}
            <div className="relative">
              <div
                className={`absolute inset-0 rounded-full ${isLooping ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-600"
                  } blur-sm sm:blur-md opacity-50 animate-pulse`}
              ></div>
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-500 flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 ${isLooping
                  ? "border-purple-400 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white shadow-lg shadow-purple-500/50"
                  : "bg-black/50 text-gray-400 hover:border-white hover:text-white"
                  }`}
                aria-label={isLooping ? "Disable repeat" : "Enable repeat"}
              >
                <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
                {isLooping && (
                  <div className="absolute inset-0 rounded-full border border-purple-400 animate-ping"></div>
                )}
              </button>
            </div>
          </div>

          {/* Enhanced Volume Control Section - Responsive */}
          <div className="flex items-center justify-center mb-6 sm:mb-8 px-2">
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 bg-black/30 backdrop-blur-lg rounded-full px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 border border-white/10 w-full max-w-xs sm:max-w-sm">
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-400 flex-shrink-0" />
              <div className="relative w-full max-w-[180px] sm:max-w-[200px]">
                {/* Volume Track */}
                <div className="w-full h-1.5 sm:h-2 md:h-3 bg-gray-700 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full animate-pulse"></div>
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 relative overflow-hidden"
                    style={{ width: `${volume * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>

                {/* Volume Slider */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(Number.parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Volume control"
                />

                {/* Volume Thumb */}
                <div
                  className="absolute top-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transform -translate-y-1/2 shadow-md shadow-purple-500/50 animate-pulse pointer-events-none"
                  style={{ left: `calc(${volume * 100}% - 6px)` }}
                >
                  <div className="absolute inset-0 rounded-full border border-white/30 animate-ping"></div>
                </div>
              </div>
              <span className="text-purple-400 font-mono text-xs sm:text-sm min-w-[2rem] sm:min-w-[3rem] text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Additional Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-3 rounded-full transition-all duration-300 ${isLiked
                ? "text-red-500 bg-red-500/10 shadow-lg shadow-red-500/25"
                : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            </button>

            {session?.user?.id && songCreatorId && session.user.id !== songCreatorId && (
              <button
                onClick={handleFollowToggle}
                className={`px-4 py-2 border  rounded-full flex  items-center transition-all duration-300 ${isFollowing
                    ? "text-white bg-blue-600 hover:bg-blue-700"
                    : "text-white bg-blue-600 hover:bg-blue-700"
                  }`}
                disabled={isLoadingFollowing}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-5 h-5" />
                    <span className="ml-4 text-lg">Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 " />
                    <span className="ml-4 text-lg">Follow</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setShowShareModal(true)}
              className="p-3 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Enhanced Playlist - Responsive */}
        <div className="mt-6 sm:mt-8 bg-black/40 backdrop-blur-xl rounded-3xl p-3 sm:p-4 md:p-6 border border-white/10 shadow-2xl w-full max-w-2xl animate-slide-up mx-2 sm:mx-4">
          <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Now Playing Queue
          </h3>
          <div className="grid gap-2 sm:gap-3 max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto scrollbar-hide px-1">
            {currentSongs.map((song, index) => (
              <div
                key={song.id}
                className={`group p-2 sm:p-3 md:p-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${index === currentSong
                  ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50 shadow-lg shadow-purple-500/25 animate-glow-border"
                  : "bg-white/5 hover:bg-white/10 hover:shadow-lg"
                  }`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  <div
                    className="relative flex-shrink-0 cursor-pointer"
                    onClick={() => handleOpenSongMediaSelection(song)}
                  >
                    <Image
                      src={song.thumbnailUrl || "/logo.png"}
                      alt={song.title}
                      width="12"
                      height="12"
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {index === currentSong && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl animate-pulse"></div>
                    )}
                    {index === currentSong && isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-white rounded-full animate-ping"></div>
                      </div>
                    )}
                  </div>
                  <div>  <div
                    className="flex-1 min-w-0 cursor-pointer" // Add cursor-pointer here
                    onClick={() => setCurrentSong(index)} // <--- New onClick location
                  >
                    <p
                      className={`font-semibold text-sm sm:text-base truncate mb-0.5 sm:mb-1 transition-colors duration-300 ${index === currentSong ? "text-white" : "text-gray-200 group-hover:text-white"
                        }`}
                      title={song.title}
                    >
                      {song.title}
                    </p>
                    <div className="flex items-center justify-between w-full">
                      <p
                        className={`text-xs sm:text-sm truncate transition-colors duration-300 ${index === currentSong ? "text-purple-300" : "text-gray-400 group-hover:text-gray-300"
                          }`}
                        title={song.provider === 'suno' ? 'PlanetQ AI' : 'Q_world studio'}
                      >
                        {song.provider === 'suno' ? 'PlanetQ AI' : 'Q_world studio'}
                      </p>


                    </div>
                    <div>
                      <p className="text-xs text-purple-300/80 ml-2 truncate max-w-[100px]" title={`Created by ${song.User.fullName}`}>
                        {song.User.fullName}
                      </p>
                      <p className="text-xs text-gray-400">Click the image to change albuurm image</p>
                    </div>
                  </div></div>


                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <span className="text-gray-400 text-xs sm:text-sm font-mono whitespace-nowrap">
                      {song.duration}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {showShareButton && (
                        <button
                          onClick={() => setShowShareModal(true)}
                          className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300 opacity-100 sm:opacity-0 group-hover:opacity-100"
                          aria-label="Share song"
                        >
                          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}

                      <SaleToggleButton
                        songId={song.id}
                        isForSaleProp={song.isForSale}
                        salePriceProp={song.salePrice}
                        isLyricsPurchasedProp={song.isLyricsPurchased}
                        onStatusChange={(updatedSong) => {
                          window.location.reload();
                        }}
                        className="w-6 h-6 sm:w-8 sm:h-8"
                      />

                      {!isPublic && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="p-1.5 sm:p-2 rounded-full hover:bg-gray-700 transition-colors"
                              aria-label="Delete song"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 hover:text-red-400" />
                            </button>
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
                              <AlertDialogAction onClick={(e) => deleteSong(song.id, e)}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {index === currentSong && (
                        <div className="hidden sm:flex space-x-0.5 ml-1">
                          <div className="w-0.5 h-3 sm:h-4 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-0.5 h-3 sm:h-4 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-0.5 h-3 sm:h-4 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Current track indicator */}
                <div
                  className={`h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 ${index === currentSong
                    ? "w-full opacity-100"
                    : "w-0 opacity-0 group-hover:w-full group-hover:opacity-50"
                    } mt-2 sm:mt-3`}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* Share Modal - Responsive */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gray-900/95 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-4 backdrop-blur-xl relative overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-16 -left-16 sm:-top-20 sm:-left-20 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-2xl sm:blur-3xl animate-pulse-slow"></div>
                <div className="absolute -bottom-16 -right-16 sm:-bottom-20 sm:-right-20 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full filter blur-2xl sm:blur-3xl animate-pulse-slow animation-delay-2000"></div>
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Share Tracks</h3>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    aria-label="Close share modal"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <div className="space-y-4 max-h-60 overflow-y-auto mb-4 sm:mb-6 pr-2">
                  {currentSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSongs.includes(song.id)}
                        onChange={() => toggleSongSelection(song.id)}
                        className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        aria-label={`Select ${song.title} for sharing`}
                      />
                      <img
                        src={song.cover || "/logo.png"}
                        alt={song.title}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium truncate">{song.title}</p>
                        <p className="text-xs text-gray-400 truncate">{song.artist || 'Unknown Artist'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleGenerateLink(selectedSongs)}
                    disabled={selectedSongs.length === 0}
                    className="flex-1 py-2 sm:py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Share Selected
                  </button>
                  <button
                    onClick={() => handleGenerateLink(currentSongs.map(s => s.id))}
                    className="flex-1 py-2 sm:py-3 px-4 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-all duration-300"
                  >
                    Share All
                  </button>
                </div>

                {shareLink && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      />
                      <button
                        onClick={handleCopyToClipboard}
                        className="py-2 px-4 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-all duration-300 whitespace-nowrap"
                      >
                        {isLinkCopied ? "Copied!" : "Copy Link"}
                      </button>
                    </div>

                    {/* Social Sharing Buttons */}
                    <div className="flex justify-center space-x-4 py-2">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Check out this playlist: ${shareLink}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full bg-green-500/20 hover:bg-green-500/30 transition-colors"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5 text-green-400" />
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                        title="Share on Facebook"
                      >
                        <Facebook className="w-5 h-5 text-blue-400" />
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=Check%20out%20this%20awesome%20playlist!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 transition-colors"
                        title="Share on Twitter"
                      >
                        <Twitter className="w-5 h-5 text-cyan-400" />
                      </a>
                    </div>

                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="email"
                        placeholder="Enter email to share"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      />
                      <button
                        onClick={handleSendEmail}
                        className="py-2 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:scale-105 transition-all duration-300 whitespace-nowrap"
                      >
                        Send Email
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full mt-4 py-3 px-4 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Styles */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }

        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 5px rgba(147, 51, 234, 0.5); }
          50% { text-shadow: 0 0 20px rgba(147, 51, 234, 0.8), 0 0 30px rgba(219, 39, 119, 0.5); }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes glow-border {
          0%, 100% { box-shadow: 0 0 5px rgba(147, 51, 234, 0.3); }
          50% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.6), 0 0 30px rgba(219, 39, 119, 0.4); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes spin-slow-2 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-particles {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse-ring {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: scale(1.1);
            opacity: 0.6;
          }
        }

        @keyframes pulse-ring-delayed {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.2;
          }
          50% { 
            transform: scale(1.15);
            opacity: 0.4;
          }
        }

        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 0.75;
            filter: blur(4px);
          }
          50% { 
            opacity: 1;
            filter: blur(8px);
          }
        }

        @keyframes pulse-glow-delayed {
          0%, 100% { 
            opacity: 0.5;
            filter: blur(6px);
          }
          50% { 
            opacity: 0.8;
            filter: blur(12px);
          }
        }

        @keyframes pulse-delayed {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .animate-glow-border {
          animation: glow-border 2s ease-in-out infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }

        .animate-spin-slow-2 {
          animation: spin-slow-2 8s linear infinite;
        }

        .animate-spin-particles {
          animation: spin-particles 20s linear infinite;
        }

        .animate-pulse-ring {
          animation: pulse-ring 3s ease-in-out infinite;
        }

        .animate-pulse-ring-delayed {
          animation: pulse-ring-delayed 3s ease-in-out infinite;
          animation-delay: 1.5s;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-pulse-glow-delayed {
          animation: pulse-glow-delayed 2s ease-in-out infinite;
          animation-delay: 1s;
        }

        .animate-pulse-delayed {
          animation: pulse-delayed 2s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

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

export default FuturisticMusicPlayer
