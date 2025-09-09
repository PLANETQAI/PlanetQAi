"use client";

import React, { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useWebRTCSession } from "@/hooks/useWebRTCSession";

export default function VoiceChat() {
  const {
    status,
    error,
    startSession,
    stopSession,
    messages,
    isProcessing,
  } = useWebRTCSession();

  // Handle errors with toast notifications
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const isConnected = status === "connected";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-4">Voice Assistant</h1>

      {/* Session Status */}
      <div
        className={`mb-4 text-sm font-medium ${
          isConnected ? "text-green-400" : "text-gray-400"
        }`}
      >
        {status === "idle" && "Idle"}
        {status === "connecting" && "Connecting..."}
        {isConnected && "Listening..."}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mb-6">
        {!isConnected ? (
          <button
            onClick={startSession}
            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-white transition"
            disabled={status === "connecting"}
          >
            {status === "connecting" ? "Connecting..." : "Start Voice Assistant"}
          </button>
        ) : (
          <button
            onClick={stopSession}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white transition"
          >
            Stop
          </button>
        )}
      </div>

      {/* Music Generation Loading */}
      {isProcessing && (
        <div className="text-yellow-400 text-sm mb-4">
          Generating music...
        </div>
      )}

      {/* Messages */}
      <div className="w-full max-w-lg bg-gray-800 rounded-lg p-4 overflow-y-auto max-h-64">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center">No messages yet</p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 ${
                msg.type === "assistant" ? "text-blue-400" : "text-white"
              }`}
            >
              {msg.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
