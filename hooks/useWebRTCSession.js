"use client";

import { getToken } from "@/lib/openai/token";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast"; // ✅ For notifications
import { MusicGenerationAPI } from "@/utils/voiceAssistant/apiHelpers";

export function useWebRTCSession() {
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | error
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const pcRef = useRef(null);
  const audioRef = useRef(null);
  const dcRef = useRef(null);
  const router = useRouter();

  const startSession = async () => {
    try {
      setStatus("connecting");

      // ✅ Always get a fresh token
      const client_secret = await getToken();
      console.log(client_secret)
      if (!client_secret) throw new Error("Failed to retrieve session token");

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // ✅ Remote audio element
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      document.body.appendChild(audioEl);
      audioRef.current = audioEl;

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // ✅ Add microphone input
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // ✅ Data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (event) => {
        handleDataChannelMessage(JSON.parse(event.data));
      };

      // ✅ Offer SDP
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // ✅ Send SDP to OpenAI
      const sdpResponse = await fetchRealtime(client_secret, offer);

      if (!sdpResponse.ok) {
        if (sdpResponse.status === 401) {
          console.warn("Token expired, refreshing...");
          const newToken = await getToken(true); // force refresh
          console.log("newToken",newToken)
          const retryResponse = await fetchRealtime(newToken, offer);
          console.log("retryResponse",retryResponse)
          if (!retryResponse.ok) throw new Error(`OpenAI Realtime API error after retry: ${retryResponse.status}`);
          const answerSDP = await retryResponse.text();
          await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });
        } else {
          throw new Error(`OpenAI Realtime API error: ${sdpResponse.status}`);
        }
      } else {
        const answerSDP = await sdpResponse.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });
      }

      setStatus("connected");
    } catch (err) {
      console.error("WebRTC Error:", err);
      setError(err.message);
      setStatus("error");
    }
  };

  // ✅ Stop session
  const stopSession = () => {
    if (pcRef.current) pcRef.current.close();
    if (audioRef.current && audioRef.current.parentNode) {
      audioRef.current.parentNode.removeChild(audioRef.current);
    }
    setStatus("idle");
  };

  // ✅ Make request to OpenAI Realtime
  const fetchRealtime = async (token, offer) => {
    return fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    });
  };

  // ✅ Handle messages from OpenAI Data Channel
  const handleDataChannelMessage = (data) => {
    switch (data.type) {
      case "response.text.delta":
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].type === "assistant") {
            updated[lastIndex].text += data.delta;
          } else {
            updated.push({ type: "assistant", text: data.delta });
          }
          return updated;
        });
        break;

      case "response.text.done":
        const finalText = data.response?.output?.[0]?.text || "";
        checkForJsonCommand(finalText);
        break;

      case "response.error":
        console.error("Realtime API Error:", data.error);
        setError(data.error.message);
        break;

      default:
        console.log("Unhandled event:", data);
    }
  };

  // ✅ Extract and execute JSON commands
  const checkForJsonCommand = (text) => {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        handleJsonCommand(jsonData);
      } catch (error) {
        console.error("Invalid JSON in response:", error);
      }
    }
  };

  const handleJsonCommand = (jsonData) => {
    if (jsonData.createSong) {
      triggerMusicGeneration(jsonData);
    }

    if (jsonData.navigateTo) {
      router.push(jsonData.url || "/");
    }
  };

  // ✅ Trigger music generation
  const triggerMusicGeneration = async (musicData) => {
    setIsProcessing(true);
    try {
      const result = await MusicGenerationAPI.generateMusic(musicData);
      console.log("✅ Music generated:", result);
      toast.success("Your AI song is ready!");
    } catch (error) {
      console.error("❌ Music generation failed:", error);
      toast.error("Failed to generate music");
    } finally {
      setIsProcessing(false);
    }
  };

  return { status, error, startSession, stopSession, messages, isProcessing };
}
