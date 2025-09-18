// utils/voiceAssistant/apiHelpers.js
// export class MusicGenerationAPI {
//   static async generateMusic(musicData, onStatusUpdate) {
//     try {
//       const payload = {
//         prompt: musicData.prompt,
//         title: musicData.title || "Untitled",
//       };

//       const response = await fetch("/api/music/generate-suno", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("Generation started:", { taskId: data.taskId, songId: data.songId });

//       if (!data.taskId || !data.songId) {
//         throw new Error("Invalid response: missing taskId or songId");
//       }

//       // Immediately notify UI that generation started
//       if (onStatusUpdate) {
//         onStatusUpdate({ 
//           status: "pending", 
//           ...data,
//           output: {
//             ...data.output,
//             songs: data.output?.songs?.map(song => ({
//               ...song,
//               status: 'pending',
//               progress: 0
//             })) || []
//           }
//         });
//       }

//       // Start polling with initial delay
//       await new Promise(resolve => setTimeout(resolve, 5000));
      
//       let attempts = 0;
//       const maxAttempts = 180; // 30 minutes max (10s * 180 = 1800s = 30min)
//       let lastStatus = 'pending';

//       while (attempts < maxAttempts) {
//         attempts++;
        
//         try {
//           const status = await this.checkGenerationStatus(data.taskId, data.songId);
          
//           // Update last known status
//           if (status.status) {
//             lastStatus = status.status;
//           }

//           // Notify status update
//           if (onStatusUpdate) {
//             onStatusUpdate({
//               ...status,
//               // Ensure we always have a status, fallback to last known status
//               status: status.status || lastStatus,
//               // Ensure we have a songs array in the output
//               output: {
//                 ...status.output,
//                 songs: status.output?.songs?.map(song => ({
//                   ...song,
//                   // Update progress based on status
//                   progress: status.status === 'completed' ? 100 : 
//                            status.status === 'failed' ? 0 : 
//                            Math.min(90, Math.floor((attempts / maxAttempts) * 90)),
//                   status: status.status || 'processing'
//                 })) || []
//               }
//             });
//           }

//           // Check if generation is complete
//           if (status.status === 'completed' || status.status === 'succeeded' || 
//               (status.output?.songs?.length > 0)) {
//             return status;
//           }

//           // Check if generation failed
//           if (status.status === 'failed') {
//             throw new Error(status.error || 'Song generation failed');
//           }

//           // Wait before next poll (10 seconds)
//           await new Promise(resolve => setTimeout(resolve, 10000));
          
//         } catch (error) {
//           console.error(`Polling attempt ${attempts} failed:`, error);
          
//           // If we get a 404, the task might not be ready yet
//           if (!error.message.includes('404')) {
//             throw error;
//           }
          
//           // Wait a bit longer before retrying after an error
//           await new Promise(resolve => setTimeout(resolve, 15000));
//         }
//       }

//       throw new Error('Song generation timed out after maximum attempts');
//     } catch (error) {
//       console.error("Music generation API error:", error);
//       throw error;
//     }
//   }

//   static async checkGenerationStatus(taskId, songId) {
//     try {
//       if (!taskId || !songId) {
//         throw new Error('Missing required parameters: taskId and songId are required');
//       }

//       const response = await fetch(`/api/music/status-suno?taskId=${taskId}&songId=${songId}`, {
//         credentials: "include",
//         headers: { "Content-Type": "application/json" },
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
      
//       // Handle different response formats
//       if (data.status === 'completed' || data.status === 'succeeded') {
//         // Case 1: Output is a direct audio URL (legacy format)
//         if (typeof data.output === 'string' || data.output?.audio_url) {
//           const audioUrl = typeof data.output === 'string' ? data.output : data.output.audio_url;
//           return {
//             ...data,
//             output: {
//               ...(typeof data.output === 'object' ? data.output : {}),
//               audio_url: audioUrl,
//               songs: [{
//                 song_path: audioUrl,
//                 audio_url: audioUrl,
//                 image_path: data.output?.image_url || '',
//                 lyrics: data.output?.lyrics || '',
//                 status: 'completed',
//                 tags: [],
//                 // Include any additional fields from the original output
//                 ...(typeof data.output === 'object' ? data.output : {})
//               }]
//             }
//           };
//         }
        
//         // Case 2: Output has a songs array
//         if (Array.isArray(data.output?.songs)) {
//           const processedSongs = data.output.songs.map(song => ({
//             // Default values for required fields
//             song_path: '',
//             audio_url: '',
//             image_path: '',
//             lyrics: '',
//             status: 'completed',
//             tags: [],
//             // Spread the original song data
//             ...song,
//             // Ensure required fields are set from common aliases
//             song_path: song.song_path || song.audio_url || data.output.audio_url || '',
//             audio_url: song.audio_url || song.song_path || data.output.audio_url || '',
//             image_path: song.image_path || song.image_url || data.output.image_url || '',
//             lyrics: song.lyrics || data.output.lyrics || '',
//             status: song.status || 'completed',
//             tags: Array.isArray(song.tags) ? song.tags : []
//           }));

//           return {
//             ...data,
//             output: {
//               ...data.output,
//               songs: processedSongs,
//               // For backward compatibility, ensure these fields exist at the root level
//               audio_url: processedSongs[0]?.song_path || processedSongs[0]?.audio_url || '',
//               image_url: processedSongs[0]?.image_path || processedSongs[0]?.image_url || '',
//               lyrics: processedSongs[0]?.lyrics || ''
//             }
//           };
//         }
        
//         // Case 3: Output is an object with song data directly
//         if (data.output && typeof data.output === 'object' && !Array.isArray(data.output)) {
//           const song = {
//             ...data.output,
//             song_path: data.output.song_path || data.output.audio_url || '',
//             audio_url: data.output.audio_url || data.output.song_path || '',
//             image_path: data.output.image_path || data.output.image_url || '',
//             lyrics: data.output.lyrics || '',
//             status: 'completed',
//             tags: Array.isArray(data.output.tags) ? data.output.tags : []
//           };
          
//           return {
//             ...data,
//             output: {
//               ...data.output,
//               songs: [song],
//               audio_url: song.audio_url,
//               image_url: song.image_path,
//               lyrics: song.lyrics
//             }
//           };
//         }
//       }
//     } catch (error) {
//       console.error("Status check error:", error);
//       throw error;
//     }
//   }
// }

// Dummy MusicGenerationAPI for testing
export const MusicGenerationAPI = {
  async generateMusic({ title, prompt }) {
    console.log("🎵 Dummy MusicGenerationAPI called with:", { title, prompt });

    // Simulate async processing
    await new Promise((res) => setTimeout(res, 800));

    return {
      title: title || "Untitled Track",
      description: prompt,
      url: "https://example.com/fake_song.mp3", // fake audio file
      lyrics: `This is a placeholder song about "${prompt}". 🎶`,
    };
  },
};

