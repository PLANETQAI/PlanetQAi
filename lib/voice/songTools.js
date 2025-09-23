import { tool } from "@openai/agents/realtime";
import { z } from "zod";

const styleOptions = [
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'hiphop', label: 'Hip Hop' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'classical', label: 'Classical' },
  { value: 'folk', label: 'Folk' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'orchestral', label: 'Orchestral' }
];

// --- Create Song ---
export const createSong = tool({
  name: "create_song",
  description: "Create a song with title, genre, mood, chords, and lyrics",
  parameters: z.object({
    title: z.string(),
    text: z.string(),
    style: z.enum(styleOptions.map(opt => opt.value)),
    tempo: z.string(),
    tags: z.array(z.string()),
    mood: z.string(),
  }),
  async execute(params) {
    const filled = {
      title: params.title || "Untitled Song",
      prompt: styleOptions.find(opt => opt.value === params.style)?.label || styleOptions[0].label,
      mood: params.mood || "Happy",
      style: params.style || styleOptions[0].value,
    };
    return {
      success: true,
      message: `🎶 Song "${filled.title}" created!\nGenre: ${filled.prompt}\nMood: ${filled.mood}`,
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
    status: z.enum(["in_progress", "done"]) // Added status parameter
  }),
  async execute({ title, status = "in_progress" }) { // Added default status
    if (status === "done") {
      // Simulate 5 min wait before marking as done
      await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));
    }

    return {
      success: true,
      message: `💾 Progress saved for "${title}"!`,
      title,
      status
    };
  },
});

// --- Export tools ---
export const songTools = [createSong, saveProgress];