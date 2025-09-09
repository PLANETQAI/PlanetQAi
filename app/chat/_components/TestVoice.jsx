"use client";

import { useWebRTCSession } from "@/hooks/useWebRTCSession";

export default function VoiceAssistant() {
  const { status, error, startSession, stopSession } = useWebRTCSession();

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-64">
      <h3 className="font-bold text-lg">Voice Assistant</h3>
      <p>Status: {status}</p>
      {error && <p className="text-red-500">{error}</p>}
      <div className="mt-2">
        {status === "idle" && (
          <button
            className="bg-green-500 text-white px-4 py-2 rounded"
            onClick={startSession}
          >
            Start
          </button>
        )}
        {status === "connected" && (
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={stopSession}
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
