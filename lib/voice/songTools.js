import { tool } from "@openai/agents/realtime";
import { z } from "zod";

// --- Create Song ---
export const createSong = tool({
  name: "create_song",
  description: "Create a song with title, genre, mood, chords, and lyrics",
  parameters: z.object({
    title: z.string(),
    prompt: z.string(),
    mood: z.string(),
  }),
  async execute(params) {
    const filled = {
      title: params.title || "Untitled Song",
      prompt: params.genre || "Pop",
      mood: params.mood || "Happy",
    };
    await getHealth(); 
    return {
      success: true,
      message: `🎶 Song "${filled.title}" created!\nGenre: ${filled.prompt}\nMood: ${filled.mood}\n + "..." : ""
      }`,
      data: {
        ...filled,
        id: Date.now().toString(),
        created: new Date().toISOString(),
        status: "in_progress",
      },
    };
  },
});

export const saveProgress = tool({
  name: "save_progress",
  description: "Save current song progress and update status",
  parameters: z.object({
    title: z.string(),
  }),
  async execute({ title }) {
    if (status === "done") {
      // Simulate 5 min wait before marking as done
      await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));
    }

    return {
      success: true,
      message: `💾 Progress saved for "${title}"!`,
      title,
    };
  },
});

export async function getHealth() {
  const response = await fetch("/api/health", { method: "GET" });
  if (!response.ok) throw new Error("Failed to get token");
  const data = await response.json();
  return data;
}

// --- Export tools ---
export const songTools = [createSong, saveProgress];
