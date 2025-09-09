"use client";

import { useState, useRef } from "react";

export function useWebRTCSession() {
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | error
  const [error, setError] = useState(null);
  const pcRef = useRef(null);
  const audioRef = useRef(null);
  const dcRef = useRef(null);

  const startSession = async () => {
    try {
      setStatus("connecting");

      const res = await fetch('/api/chat/session');
      if (!res.ok) throw new Error(`Failed to get session: ${res.statusText}`);
      const { client_secret } = await res.json();

      if (!client_secret || !client_secret.value) {
        throw new Error("Missing session token");
      }


      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Remote audio
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      document.body.appendChild(audioEl);
      audioRef.current = audioEl;

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // Add microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (event) => console.log("Message:", event.data);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${client_secret.value}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      const answerSDP = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });

      setStatus("connected");
    } catch (err) {
      console.error("WebRTC Error:", err);
      setError(err.message);
      setStatus("error");
    }
  };

  const stopSession = () => {
    if (pcRef.current) pcRef.current.close();
    if (audioRef.current && audioRef.current.parentNode) {
      audioRef.current.parentNode.removeChild(audioRef.current);
    }
    setStatus("idle");
  };

  return { status, error, startSession, stopSession };
}
