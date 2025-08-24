'use client';

import { useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';


export default function SongsManagement() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [playingSong, setPlayingSong] = useState(null);
  const [audioElement, setAudioElement] = useState(null);

  useEffect(() => {
    fetchSongs();

    // Create audio element
    const audio = new Audio();
    setAudioElement(audio);

    // Cleanup on unmount
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [currentPage]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      // Fetch real song data from the API
      const response = await fetch(`/api/admin/songs?page=${currentPage}&search=${searchTerm}`);

      if (!response.ok) {
        throw new Error('Failed to fetch songs');
      }

      const data = await response.json();
      console.log(data);
      setSongs(data.songs);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching songs:', error);
      toast.error('Failed to load songs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSongs();
  };

  const handleSongAction = (song, action) => {
    setSelectedSong(song);
    setActionType(action);
    setIsModalOpen(true);
  };

  // const confirmAction = async () => {
  //   try {
  //     if (!selectedSong) return;

  //     // Prepare the request based on action type
  //     let method = 'PATCH';
  //     let requestBody = { action: actionType };

  //     // For delete action, use DELETE method
  //     if (actionType === 'delete') {
  //       method = 'DELETE';
  //     }

  //     // Call the API
  //     const response = await fetch(`/api/songs/${selectedSong.id}`, {
  //       method: method,
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(requestBody)
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || 'Failed to perform action');
  //     }

  //     // Update UI based on successful action
  //     if (actionType === 'delete') {
  //       setSongs(songs.filter(s => s.id !== selectedSong.id));
  //       toast.success(`Song "${selectedSong.title}" has been deleted`);
  //     } else if (actionType === 'approve') {
  //       setSongs(songs.map(s => s.id === selectedSong.id ? { ...s, quality: 'approved' } : s));
  //       toast.success(`Song "${selectedSong.title}" has been approved`);
  //     } else if (actionType === 'flag') {
  //       setSongs(songs.map(s => s.id === selectedSong.id ? { ...s, quality: 'flagged' } : s));
  //       toast.success(`Song "${selectedSong.title}" has been flagged for review`);
  //     }

  //     setIsModalOpen(false);

  //     // Refresh the songs list after a short delay
  //     setTimeout(() => fetchSongs(), 1000);
  //   } catch (error) {
  //     console.error('Error performing action:', error);
  //     toast.error(error.message || 'Failed to perform action');
  //   }
  // };

  const deleteSong = async (songId, event) => {
    event.stopPropagation()
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchSongs();
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

  const handleSongUpdate = async (songId,event,actionType) => {
    event.stopPropagation()
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quality: actionType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update song status');
      }

      const updatedSong = await response.json();
      fetchSongs();
      toast.success('Song updated successfully')

      if (onStatusChange) {
        onStatusChange(updatedSong);
      }

    } catch (error) {
      console.error('Error updating song status:', error);
      alert('Failed to update song status. Please try again.');
    }
  };

  const togglePlaySong = (song) => {
    if (!audioElement) return;

    if (playingSong && playingSong.id === song.id) {
      // Pause currently playing song
      audioElement.pause();
      setPlayingSong(null);
    } else {
      // Play new song
      if (playingSong) {
        audioElement.pause();
      }

      audioElement.src = song.audioUrl;
      audioElement.play().catch(error => {
        console.error('Error playing audio:', error);
        toast.error('Failed to play audio');
      });

      setPlayingSong(song);

      // Reset playing state when song ends
      audioElement.onended = () => {
        setPlayingSong(null);
      };
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Song Management</h1>
        <button
          onClick={fetchSongs}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search by title, user, or prompt"
            />
          </div>
          <button
            type="submit"
            className="ml-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md"
          >
            Search
          </button>
        </form>
      </div>

      {/* Songs Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Song</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Prompt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {songs.map((song) => (
                    <tr key={song.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <img className="h-10 w-10 rounded-md object-cover" src={song.thumbnailUrl} alt="" />
                            <button
                              onClick={() => togglePlaySong(song)}
                              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md"
                            >
                              {playingSong && playingSong.id === song.id ? (
                                <PauseIcon className="h-5 w-5 text-white" />
                              ) : (
                                <PlayIcon className="h-5 w-5 text-white" />
                              )}
                            </button>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{song.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{song.userName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300 truncate max-w-xs">{song.prompt}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${song.provider === 'Diffrhythm' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                          {song.provider === 'suno' ? 'PlanetQ AI' : 'Q_world studio'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{song.creditsUsed}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {song.quality === 'approved' ? (
                          <span className="flex items-center text-green-400">
                            <CheckCircleIcon className="h-5 w-5 mr-1" /> Approved
                          </span>
                        ) : song.quality === 'flagged' ? (
                          <span className="flex items-center text-red-400">
                            <XCircleIcon className="h-5 w-5 mr-1" /> Flagged
                          </span>
                        ) : (
                          <span className="flex items-center text-yellow-400">
                            <span className="h-2 w-2 bg-yellow-400 rounded-full mr-2"></span> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(song.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                            <Dialog>
                            <DialogTrigger asChild>
                            <button 
                            className="text-green-400 hover:text-green-300"
                            title="Approve Song"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button> 

                            </DialogTrigger>

                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Song</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to approve this song?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button onClick={() => handleSongAction(song.id, 'approve')}>Approve</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                           <Dialog>
                            <DialogTrigger asChild>
                            <button 

                            className="text-yellow-400 hover:text-yellow-300"
                            title="Flag Song"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button> 

                            </DialogTrigger>

                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Flag Song</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to flag this song?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button onClick={(e) => {
                                  e.preventDefault();
                                  handleSongUpdate(song.id, e, 'flagged');
                                }}>Flag</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button

                                className="text-red-400 hover:text-red-300"
                                title="Delete Song"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>

                            </DialogTrigger>

                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Song</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this song?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button onClick={() => deleteSong(song.id)}>Delete</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-600">
              <div className="flex-1 flex justify-between">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md ${currentPage === 1
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-600'
                    }`}
                >
                  Previous
                </button>
                <div className="text-sm text-gray-300">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md ${currentPage === totalPages
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-600'
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
