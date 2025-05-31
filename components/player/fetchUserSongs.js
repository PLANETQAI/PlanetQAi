// Fetch user's songs from the database
const fetchUserSongs = async (
  setGeneratedSongs,
  selectSong,
  currentSongId,
  generatedAudio
) => {
  console.log('Starting to fetch Suno songs...')
  try {
    // First check if the user is authenticated by getting the session
    const sessionResponse = await fetch('/api/auth/session')
    const sessionData = await sessionResponse.json()
    
    if (!sessionData || !sessionData.user) {
      console.log('User not authenticated, skipping song fetch')
      return
    }
    
    // Fetch all user songs and filter locally
    const response = await fetch('/api/songs', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch songs: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('All songs from API:', data)
    if (data.songs && Array.isArray(data.songs)) {
      // Filter songs for Suno (include both completed and pending songs)
      const sunoSongs = data.songs.filter(song => {
        // Check provider field
        if (song.provider === 'suno') return true;
        
        // Check tags array
        if (song.tags && Array.isArray(song.tags)) {
          return song.tags.some(tag => tag === 'provider:suno');
        }
        
        return false;
      });
      
      console.log(`Filtered ${sunoSongs.length} Suno songs from ${data.songs.length} total songs`);
      
      // Sort songs by creation date (newest first)
      const sortedSongs = sunoSongs.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
      
      // Map database songs to the format used in the component
      const formattedSongs = sortedSongs.map(song => {
        // Extract provider, style, tempo, mood from tags if available
        let provider = 'suno';
        let style = 'pop';
        let tempo = 'medium';
        let mood = 'neutral';
        let status = song.audioUrl ? 'completed' : 'pending';
        
        if (song.tags && Array.isArray(song.tags)) {
          song.tags.forEach(tag => {
            if (tag.startsWith('provider:')) {
              provider = tag.split(':')[1];
            } else if (tag.startsWith('style:')) {
              style = tag.split(':')[1];
            } else if (tag.startsWith('tempo:')) {
              tempo = tag.split(':')[1];
            } else if (tag.startsWith('mood:')) {
              mood = tag.split(':')[1];
            } else if (tag === 'status:pending') {
              status = 'pending';
            } else if (tag === 'status:completed') {
              status = 'completed';
            }
          });
        }
        
        // Check if this is the current song being generated
        const isCurrentSong = song.id === currentSongId;
        
        // If song has song_path but no audioUrl, use song_path as audioUrl
        const audioUrl = song.audioUrl || (song.song_path ? song.song_path : null);
        
        // If this is the current song and we have generated audio, override status
        if (isCurrentSong && generatedAudio) {
          status = 'completed';
        }
        
        return {
          id: song.id,
          title: song.title || 'Untitled Song',
          audioUrl: audioUrl,
          song_path: song.song_path || audioUrl, // Ensure song_path is available
          lyrics: song.lyrics,
          coverImageUrl: song.thumbnailUrl || song.coverImageUrl || song.image_path,
          image_path: song.image_path || song.coverImageUrl || song.thumbnailUrl,
          duration: song.duration || 0,
          createdAt: song.createdAt,
          generator: provider,
          prompt: song.prompt,
          style: song.style || style,
          tempo: song.tempo || tempo,
          mood: song.mood || mood,
          status: status // Add explicit status field
        };
      });
      
      // Update the songs state
      setGeneratedSongs(formattedSongs);
      
      // If songs exist, select the first (newest) one
      if (formattedSongs.length > 0) {
        selectSong(0);
      }
      
      // If we have a current song ID, find and select it
      if (currentSongId) {
        const currentSongIndex = formattedSongs.findIndex(song => song.id === currentSongId);
        if (currentSongIndex >= 0) {
          selectSong(currentSongIndex);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user songs:', error);
  }
}

export default fetchUserSongs;
