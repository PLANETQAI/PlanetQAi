export class MusicGenerationAPI {
    static async generateMusic(musicData) {
      try {
        const payload = {
          prompt: musicData.prompt,
          title: musicData.title || 'Untitled',
        };
  
        const response = await fetch('/api/music/generate-suno', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
  
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
  
        return data;
      } catch (error) {
        console.error('Music generation API error:', error);
        throw error;
      }
    }
  
    static async checkGenerationStatus(taskId, songId) {
      try {
        // First check the Suno API status
        const response = await fetch(`/api/music/status-suno?taskId=${taskId}&songId=${songId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle failed status
        if (data.status === 'failed') {
          throw new Error(data.error || 'Song generation failed');
        }
        
        // If we have a songId, also check the database for the latest status
        if (songId) {
          try {
            const songResponse = await fetch(`/api/songs/${songId}`, {
              credentials: 'include'
            });
            
            if (songResponse.ok) {
              const songData = await songResponse.json();
              if (songData.audioUrl) {
                // If we have audio in the database, use that as the source of truth
                return {
                  ...data,
                  status: 'completed',
                  output: {
                    ...data.output,
                    audio_url: songData.audioUrl,
                    // Include any other song data from the database
                    ...(songData.imageUrl && { image_url: songData.imageUrl }),
                    ...(songData.lyrics && { lyrics: songData.lyrics })
                  }
                };
              }
            }
          } catch (dbError) {
            console.error('Error checking song in database:', dbError);
            // Continue with the original data if database check fails
          }
        }
        
        // Map the response to match the expected format if we have songs
        if (data.status === 'completed' && data.output?.songs?.[0]) {
          const song = data.output.songs[0];
          return {
            ...data,
            output: {
              ...data.output,
              audio_url: song.song_path,
              image_url: song.image_path,
              lyrics: song.lyrics
            }
          };
        }
        console.log('Status check response:', data);
        return data;
      } catch (error) {
        console.error('Status check error:', error);
        throw error;
      }
    }
  }