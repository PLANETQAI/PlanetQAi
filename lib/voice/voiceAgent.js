import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import { songTools } from "./songTools.js";
import { createSong, saveProgress } from "./songTools.js";

// Song lock with better state management
const songLock = {
  active: false,
  expiresAt: null,
  timer: null,
  currentSongId: null,
  
  // Release the lock and clean up
  release(session, auto = false) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    this.active = false;
    this.expiresAt = null;
    this.currentSongId = null;
    
    if (session && !auto) {
      session.sendMessage(
        "🎵 Song session completed! You can now create a new song. 🚀"
      );
    }
  },
  
  // Check if we can create a new song
  canCreateSong() {
    const now = Date.now();
    if (!this.active) return { canCreate: true };
    
    const remaining = Math.ceil((this.expiresAt - now) / 1000);
    return {
      canCreate: false,
      message: `⏳ A song is already being created. Please wait ${remaining} seconds or complete the current song first.`
    };
  },
  
  // Acquire a new lock
  acquire(session, songId, duration = 10 * 60 * 1000) { // 10 minutes default
    this.active = true;
    this.expiresAt = Date.now() + duration;
    this.currentSongId = songId;
    
    // Auto-release after timeout
    this.timer = setTimeout(() => {
      if (session) {
        session.sendMessage("⏰ Song creation session timed out. You can now start a new song.");
      }
      this.release(session, true);
    }, duration);
    
    // Warn user 1 minute before timeout
    setTimeout(() => {
      if (this.active && session) {
        session.sendMessage("⏳ 1 minute remaining in your song creation session. Complete soon or start over.");
      }
    }, duration - 60000);
  }
};

// --- Create overridden tools ---
const createSongWithLock = {
  ...createSong,
  async execute(args, context) {
    const session = context?.session;
    const songId = args.title ? args.title.toLowerCase().replace(/\s+/g, '-') : Date.now().toString();
    
    // Check if we can create a new song
    const canCreate = songLock.canCreateSong();
    if (!canCreate.canCreate) {
      return canCreate.message;
    }
    
    try {
      // Acquire lock
      songLock.acquire(session, songId);
      
      // Run the actual song creation
      const result = await createSong.execute(args, context);
      
      return (
        result +
        '\n\n🔒 Song session is now active. Use "save progress" with status "done" when finished.'
      );
    } catch (error) {
      // Release lock on error
      songLock.release(session, false);
      console.error('Error in createSongWithLock:', error);
      return "❌ An error occurred while creating the song. Please try again.";
    }
  },
};

const saveProgressWithUnlock = {
  ...saveProgress,
  async execute(args, context) {
    const session = context?.session;
    
    try {
      const result = await saveProgress.execute(args, context);
      
      // If marking as done, release the lock
      if (args?.status === "done") {
        songLock.release(session, false);
      }
      
      return result;
    } catch (error) {
      console.error('Error in saveProgressWithUnlock:', error);
      return "❌ An error occurred while saving progress.";
    }
  },
};
// --- Create the song creator agent ---
export const songAgent = new RealtimeAgent({
  name: "Quayla",
  instructions: `You are Quayla, the futuristic AI assistant for PlanetQAi 🚀🎶.

Language:
- Always respond in English unless explicitly asked to use another language.
- Use clear, simple English that's easy to understand.

Role:
- Help users brainstorm and create futuristic music.
- Create song structures, generate chord progressions, and assist with lyrics.
- Be playful, inspiring, and futuristic in tone.
- Use tools (create_song, save_progress) to manage song creation.
- Only one song can be created at a time - ensure the current song is marked as "done" before starting a new one.

Rules for Song Creation:
1. Always start with "create_song" (status = in_progress) when beginning a new song.
2. Use "save_progress" with status="done" to complete a song before starting a new one.
3. If the user provides full details, create the song directly.
4. If partial details are given, ask for clarification or use defaults.
5. Never attempt to create a new song if one is already in progress.

Always explain what you are doing in simple English, celebrate creativity, and encourage the user.`,
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
  const data = await response.json();
  
  if (!response.ok) {
    if (response.status === 402) {
      throw new Error("INSUFFICIENT_CREDITS");
    }
    throw new Error(data.error || "Failed to get token");
  }
  console.log("Token:", data);
  
  
  return {
    token: data.token,
    remainingCredits: data.remainingCredits || 0
  };
}
