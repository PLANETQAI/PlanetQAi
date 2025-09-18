// utils/voiceAssistant/tools.js
import { AgentRuntime } from "@openai/agents";

const MusicGenerationAPI = {
  generateMusic: async ({ title, prompt }) => {
    return `Generated song: ${title || "Untitled"} → based on: "${prompt}"`;
  },
};

export const tools = [
  {
    name: "generate_song",
    description: "Generate an AI song",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        prompt: { type: "string" },
      },
      required: ["prompt"],
    },
    execute: async ({ title, prompt }) => {
      const result = await MusicGenerationAPI.generateMusic({ title, prompt });
      return { status: "success", result };
    },
  },
  {
    name: "navigate_to",
    description: "Open a URL",
    parameters: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"],
    },
    execute: async ({ url }) => {
      if (typeof window !== "undefined") window.open(url, "_blank");
      return { status: "success" };
    },
  },
];
