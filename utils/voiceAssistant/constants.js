export const VOICE_ASSISTANT_CONSTANTS = {
    OPENAI_MODEL: "gpt-4o-realtime-preview",
    OPENAI_BASE_URL: "https://api.openai.com/v1/realtime",
    DEFAULT_VOICE: "alloy",
    AUDIO_FORMAT: "pcm16",
    TURN_DETECTION: {
      type: "server_vad",
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 200
    },
    GENERATION_TIMEOUT: 600000, // 10 minutes
    STATUS_CHECK_INTERVAL: 5000 // 5 seconds
  };
  
  export const EVENT_TYPES = {
    // OpenAI Realtime API events
    SESSION_UPDATE: "session.update",
    CONVERSATION_ITEM_CREATE: "conversation.item.create",
    RESPONSE_CREATE: "response.create",
    RESPONSE_AUDIO_TRANSCRIPT_DELTA: "response.audio_transcript.delta",
    RESPONSE_AUDIO_TRANSCRIPT_DONE: "response.audio_transcript.done",
    RESPONSE_TEXT_DELTA: "response.text.delta",
    RESPONSE_TEXT_DONE: "response.text.done",
    RESPONSE_DONE: "response.done",
    
    // Custom events
    MUSIC_GENERATION_START: "music_generation_start",
    MUSIC_GENERATION_COMPLETE: "music_generation_complete",
    NAVIGATION_REQUEST: "navigation_request"
  };