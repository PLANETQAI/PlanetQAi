// utils/voiceAssistant/runtime.js
"use client";

import { tools } from "./tools";

export const runtime = new AgentRuntime({
  tools,
});
