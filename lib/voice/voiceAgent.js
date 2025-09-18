import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import { songTools } from "./songTools.js";
import { createSong, saveProgress } from "./songTools.js";

let songLock = {
  active: false,
  expiresAt: null,
  timer: null,
};

// --- Helper to release the lock ---
function releaseSongLock(session, auto = false) {
  songLock.active = false;
  songLock.expiresAt = null;
  if (songLock.timer) {
    clearTimeout(songLock.timer);
    songLock.timer = null;
  }

  // Send message to session
  session.sendMessage(
    "Song session marked as done! You can now create a new song. 🚀"
  );
}

// --- Create overridden tools ---
const createSongWithLock = {
  ...createSong,
  async execute(args, context) {
    const now = Date.now();
    const session = context?.session;

    // If locked, block the request
    if (songLock.active && songLock.expiresAt > now) {
      const remaining = Math.ceil((songLock.expiresAt - now) / 1000);
      return `⏳ A song is already being created. Please wait ${remaining}s before starting a new one.`;
    }

    // Lock for 5 minutes
    songLock.active = true;
    songLock.expiresAt = now + 5 * 60 * 1000;

    // Auto-release after timeout
    songLock.timer = setTimeout(() => {
      if (session) {
        releaseSongLock(session, true);
      }
    }, 5 * 60 * 1000);

    // Run actual tool
    const result = await createSong.execute(args, context);

    return (
      result +
      '\n\n🔒 Song session is now active. Use "save progress" with status "done" when finished.'
    );
  },
};

const saveProgressWithUnlock = {
  ...saveProgress,
  async execute(args, context) {
    const session = context?.session;

    // If marking as done, release the lock
    if (args?.status === "done") {
      releaseSongLock(session, false);
    }

    return await saveProgress.execute(args, context);
  },
};
// --- Create the song creator agent ---
export const songAgent = new RealtimeAgent({
  name: "Quayla",
  instructions: `You are Quayla, the futuristic AI assistant for PlanetQAi 🚀🎶.

Role:
- Help users brainstorm and create futuristic music.
- Create song structures, generate chord progressions, and assist with lyrics.
- Be playful, inspiring, and futuristic in tone.
- Use tools (create_song, save_progress) to manage song creation.
- Do not start a new song until the last one is marked as "done".

Rules:
- Start every new song with "create_song" (status = in_progress).
- Always track and update the status with "save_progress".
- Do not start a new song until the last one is saved as "done".
- If the user provides full details, create the song directly.
- If partial details are given, fill in missing parts with defaults.

Always explain what you are doing, celebrate creativity, and encourage the user.`,
  tools: [createSongWithLock, saveProgressWithUnlock],
});

// --- Create session ---
export function createSession() {
  const session = new RealtimeSession(songAgent, {
    model: "gpt-realtime",
  });

  // Proactive greeting after connection
  session.connect("session_started", () => {
    session.sendMessage({
      type: "message",
      role: "assistant",
      content: [
        {
          type: "output_text",
          text: "🎶 Hey there, I’m Quayla — your futuristic music companion! 🚀✨ I can help you craft songs, generate chords, or polish lyrics. What kind of music are you dreaming of today?",
        },
      ],
    });
  });

  let chatHistory = [];

  // Helper function to emit history updates
  const emitHistoryUpdate = () => {
    session.emit("history_updated", [...chatHistory]);
  };

  // Handle user speech input
  session.on(
    "conversation.item.input_audio_transcription.completed",
    (event) => {
      chatHistory.push({
        role: "user",
        type: "message",
        content: [
          {
            type: "input_text",
            text: event.transcript,
          },
        ],
      });
      emitHistoryUpdate();
    }
  );

  // Handle assistant text responses
  session.on("response.text.delta", (event) => {
    const lastItem = chatHistory[chatHistory.length - 1];
    if (
      lastItem &&
      lastItem.role === "assistant" &&
      lastItem.type === "message"
    ) {
      // Update existing message
      if (lastItem.content[0]) {
        lastItem.content[0].text =
          (lastItem.content[0].text || "") + event.delta;
      }
    } else {
      // Create new message
      chatHistory.push({
        role: "assistant",
        type: "message",
        content: [
          {
            type: "output_text",
            text: event.delta,
          },
        ],
      });
    }
    emitHistoryUpdate();
  });

  // Handle function calls
  session.on("response.function_call_arguments.delta", (event) => {
    const lastItem = chatHistory[chatHistory.length - 1];
    if (
      lastItem &&
      lastItem.type === "function_call" &&
      lastItem.call_id === event.call_id
    ) {
      // Update existing function call
      lastItem.arguments = (lastItem.arguments || "") + event.delta;
    } else {
      // Create new function call
      chatHistory.push({
        role: "assistant",
        type: "function_call",
        call_id: event.call_id,
        name: event.name,
        arguments: event.delta,
      });
    }
    emitHistoryUpdate();
  });

  // Handle function call outputs
  session.on("response.function_call_arguments.done", (event) => {
    // Find the function call and mark it as complete
    const functionCall = chatHistory.find(
      (item) => item.type === "function_call" && item.call_id === event.call_id
    );
    if (functionCall) {
      try {
        functionCall.parsedArguments = JSON.parse(functionCall.arguments);
      } catch (e) {
        console.warn(
          "Failed to parse function arguments:",
          functionCall.arguments
        );
      }
    }
    emitHistoryUpdate();
  });

  // Handle tool responses/outputs
  session.on("conversation.item.created", (event) => {
    if (event.item.type === "function_call_output") {
      chatHistory.push({
        role: "tool",
        type: "function_call_output",
        call_id: event.item.call_id,
        output: event.item.output,
      });
      emitHistoryUpdate();
    }
  });

  session.on("error", (error) => {
    console.error("Voice session error:", error);
  });

  // Handle connection events
  session.on("connected", () => {
    console.log("Voice session connected successfully");
    chatHistory.push({
      role: "assistant",
      type: "message",
      content: [
        {
          type: "output_text",
          text: "🎶 Hey there, I'm Quayla — your futuristic music companion! 🚀✨ I can help you craft songs, generate chords, or polish lyrics. What kind of music are you dreaming of today?",
        },
      ],
    });
    emitHistoryUpdate();
  });

  session.on("error", (error) => {
    console.error("Voice session error:", error);
    chatHistory.push({
      role: "system",
      type: "error",
      content: [
        {
          type: "error_text",
          text: `Error: ${error.message || "Unknown error occurred"}`,
        },
      ],
    });
    emitHistoryUpdate();
  });

  // Handle microphone permissions
  session.on("input_audio_buffer.speech_started", () => {
    console.log("Speech detected");
  });

  session.on("input_audio_buffer.speech_stopped", () => {
    console.log("Speech ended");
  });

  return session;
}

// --- Get client token ---
export async function getToken() {
  const response = await fetch("/api/chat/token", { method: "POST" });
  if (!response.ok) throw new Error("Failed to get token");
  const data = await response.json();
  return data.token;
}
