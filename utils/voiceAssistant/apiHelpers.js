// utils/voiceAssistant/apiHelpers.js
export class MusicGenerationAPI {
  static async generateMusic(musicData, onStatusUpdate) {
    try {
      const payload = {
        prompt: musicData.prompt,
        title: musicData.title || "Untitled",
      };

      const response = await fetch("/api/music/generate-suno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
     console.log("response", response);
      const data = await response.json();
      console.log("data", data);
      if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);
      if (!data.taskId) throw new Error("Invalid response: missing taskId");

      // Immediately notify UI that generation started
      if (onStatusUpdate) onStatusUpdate({ status: "pending", ...data });

      // 🔁 Poll every 20s until completion
      let finalData = data;
      while (true) {
        await new Promise((r) => setTimeout(r, 20000)); // wait 20s

        const status = await this.checkGenerationStatus(data.taskId, data.songId);
        if (onStatusUpdate) onStatusUpdate(status);

        if (
          status.status === "completed" ||
          status.status === "failed" ||
          (status.output?.songs && status.output.songs.length > 0)
        ) {
          finalData = status;
          break;
        }
      }

      return finalData;
    } catch (error) {
      console.error("Music generation API error:", error);
      throw error;
    }
  }

  static async checkGenerationStatus(taskId, songId) {
    try {
      const response = await fetch(`/api/music/status-suno?taskId=${taskId}&songId=${songId}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // handle mapping like before...
      if (data.status === "completed" && data.output?.songs?.[0]) {
        const song = data.output.songs[0];
        return {
          ...data,
          output: {
            ...data.output,
            audio_url: song.song_path,
            image_url: song.image_path,
            lyrics: song.lyrics,
          },
        };
      }

      return data;
    } catch (error) {
      console.error("Status check error:", error);
      throw error;
    }
  }
}
