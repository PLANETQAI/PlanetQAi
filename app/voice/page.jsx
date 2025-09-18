"use client";

import { useState } from "react";
import { useWebRTCSession } from "@/hooks/useWebRTCSession";

export default function VoiceAssistant() {
  const {
    status,
    error,
    startSession,
    stopSession,
    messages,
    isProcessing,
    generationStatus,
    sendMessage,   // 👈 from hook
  } = useWebRTCSession();

  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message);  // ✅ direct call
      setMessage("");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">🎙️ Voice Assistant</h2>

      {/* Status */}
      <p className="text-sm text-gray-600">
        {status === "idle" && "🟢 Ready to start"}
        {status === "connecting" && "🔄 Connecting..."}
        {status === "connected" && "✅ Connected"}
        {status === "error" && `❌ Error: ${error?.message || error}`}
      </p>

      {/* Start / Stop session */}
      <div className="flex gap-2">
        {status !== "connected" ? (
          <button
            onClick={() => startSession()}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Start Session
          </button>
        ) : (
          <button
            onClick={stopSession}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Stop Session
          </button>
        )}
      </div>

      {/* Text input */}
      {status === "connected" && (
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type something..."
            className="border p-2 flex-1 rounded"
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="mt-4 border rounded p-2 h-64 overflow-y-auto bg-gray-50">
        {messages.length === 0 && (
          <p className="text-gray-400">No messages yet...</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 my-1 rounded ${
              msg.from === "assistant"
                ? "bg-purple-100 text-purple-900"
                : "bg-blue-100 text-blue-900"
            }`}
          >
            <strong>{msg.from === "assistant" ? "Quayla" : "You"}:</strong>{" "}
            {msg.text}
          </div>
        ))}
      </div>

      {/* Generation status (when tools run) */}
      {isProcessing && (
        <p className="text-sm text-yellow-600">
          🎶 Generating song... ({generationStatus})
        </p>
      )}
    </div>
  );
}
