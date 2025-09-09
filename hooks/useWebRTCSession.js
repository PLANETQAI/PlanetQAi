"use client";

import { getToken } from "@/lib/openai/token";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { MusicGenerationAPI } from "@/utils/voiceAssistant/apiHelpers";

export function useWebRTCSession() {
     
  const functionArgsBuffer = useRef({}); // Keep partial arguments

  const [status, setStatus] = useState("idle"); // idle | connecting | connected | disconnecting | error
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeToolUI, setActiveToolUI] = useState(null); 
  const [showNavigationPopup, setShowNavigationPopup] = useState({ open: false, url: "" });
  const [showSongPopup, setShowSongPopup] = useState({ open: false, title: "", prompt: "" });
  
  // { type, data, isLoading, onConfirm, onCancel }

  const pcRef = useRef(null);
  const audioRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const isMounted = useRef(true);
  const router = useRouter();

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pcRef.current) {
      // Close peer connection
      try {
        const pc = pcRef.current;
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.oniceconnectionstatechange = null;
        pc.onsignalingstatechange = null;
        pc.onicegatheringstatechange = null;
        pc.onconnectionstatechange = null;
        
        // Close data channels
        if (dcRef.current) {
          dcRef.current.onmessage = null;
          dcRef.current.onopen = null;
          dcRef.current.onclose = null;
          dcRef.current.close();
          dcRef.current = null;
        }
        
        // Close peer connection
        pc.close();
      } catch (err) {
        console.error("Error during cleanup:", err);
      } finally {
        pcRef.current = null;
      }
    }

    // Clean up audio element
    if (audioRef.current) {
      try {
        if (audioRef.current.srcObject) {
          audioRef.current.srcObject.getTracks().forEach(track => track.stop());
          audioRef.current.srcObject = null;
        }
        if (audioRef.current.parentNode) {
          audioRef.current.pause();
          audioRef.current.parentNode.removeChild(audioRef.current);
        }
      } catch (err) {
        console.error("Error cleaning up audio:", err);
      } finally {
        audioRef.current = null;
      }
    }

    // Clean up local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  }, []);

  // Handle data channel messages
  const handleDataChannelMessage = useCallback((data) => {
    try {
      setMessages(prev => [...prev, { from: 'assistant', text: data.delta || data.text || '', timestamp: new Date().toISOString() }]);
    } catch (err) {
      console.error('Error handling data channel message:', err);
    }
  }, []);

  // Send message through data channel
  const sendMessage = useCallback((message) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') {
      console.warn('Data channel not ready');
      return false;
    }
    
    try {
      dcRef.current.send(JSON.stringify({
        type: 'user_message',
        text: message
      }));
      setMessages(prev => [...prev, { from: 'user', text: message, timestamp: new Date().toISOString() }]);
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  }, []);

  // Start WebRTC session
  const startSession = useCallback(async (options = {}) => {
    if (!isMounted.current) return;
    
    // Don't start if already connecting or connected
    if (['connecting', 'connected'].includes(status)) {
      console.log('Session already active');
      return;
    }

    setStatus("connecting");
    setError(null);

    try {
      // Get a fresh token
      const client_secret = await getToken();
      if (!client_secret) {
        throw new Error("Failed to retrieve session token");
      }

      // Create new peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      // Create audio element for remote audio
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.controls = false;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      audioRef.current = audioEl;

      // Handle remote tracks
      pc.ontrack = (e) => {
        if (e.streams && e.streams[0] && audioRef.current) {
          audioRef.current.srcObject = e.streams[0];
        }
      };

      // Handle connection state changes
      pc.oniceconnectionstatechange = () => {
        if (!isMounted.current) return;
        
        const connectionState = pc.iceConnectionState;
        console.log('ICE connection state:', connectionState);
        
        if (connectionState === 'failed' || connectionState === 'disconnected' || connectionState === 'closed') {
          setStatus('error');
          setError(new Error(`Connection ${connectionState}`));
          cleanup();
        }
      };

      // Add microphone input
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      
      dc.onopen = () => {
        if (!isMounted.current) return;
        console.log('Data channel opened');
      };
      
      dc.onclose = () => {
        if (!isMounted.current) return;
        console.log('Data channel closed');
        if (status !== 'disconnecting') {
          setStatus('error');
          setError(new Error('Data channel closed unexpectedly'));
          cleanup();
        }
      };
      
      dc.onerror = (err) => {
        console.error('Data channel error:', err);
        if (isMounted.current) {
          setStatus('error');
          setError(err);
          cleanup();
        }
      };
      
      dc.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
        //   handleDataChannelMessage(data);
        handleDataChannelEvent(data);
        } catch (err) {
          console.error('Error parsing data channel message:', err);
        }
      };

      // Create and set local description
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
        voiceActivityDetection: true
      });
      
      await pc.setLocalDescription(offer);

      // Send SDP to OpenAI
      const sdpResponse = await fetchRealtime(client_secret, offer);

      if (!sdpResponse.ok) {
        if (sdpResponse.status === 401) {
          console.warn("Token expired, refreshing...");
          const newToken = await getToken(true); // force refresh
          const retryResponse = await fetchRealtime(newToken, offer);
          
          if (!retryResponse.ok) {
            throw new Error(`OpenAI Realtime API error after retry: ${retryResponse.status}`);
          }
          
          const answerSDP = await retryResponse.text();
          if (pc.signalingState !== 'closed') {
            await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });
          }
        } else {
          throw new Error(`OpenAI Realtime API error: ${sdpResponse.status}`);
        }
      } else {
        const answerSDP = await sdpResponse.text();
        if (pc.signalingState !== 'closed') {
          await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });
        }
      }

      if (isMounted.current) {
        setStatus("connected");
      }
      
    } catch (err) {
      console.error("WebRTC Error:", err);
      if (isMounted.current) {
        setError(err);
        setStatus("error");
        cleanup();
      }
    }
  }, [status, cleanup, handleDataChannelMessage]);

  // Stop session
  const stopSession = useCallback(() => {
    if (!isMounted.current) return;
    
    setStatus('disconnecting');
    cleanup();
    setStatus('idle');
    setActiveToolUI(null);
  }, [cleanup]);

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

  const handleDataChannelEvent = (data) => {
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
        checkForJsonCommand(data.response?.output?.[0]?.text || "");
        break;
  
      case "response.tool_call":
        handleToolCall(data);
        break;
  
      case "response.function_call_arguments.delta":
        // Handle streaming function arguments
        handleFunctionArgumentsDelta(data);
        break;
  
      case "response.function_call_arguments.done":
        // Now the tool arguments are complete → show popup or execute
        handleFunctionCallReady(data);
        break;
  
      case "response.error":
        console.error("Realtime API Error:", data.error);
        setError(data.error.message);
        break;
  
      default:
        console.log("Unhandled event:", data);
    }
  };


function handleFunctionArgumentsDelta(event) {
  const { item_id, delta } = event;
  if (!functionArgsBuffer.current[item_id]) {
    functionArgsBuffer.current[item_id] = "";
  }
  functionArgsBuffer.current[item_id] += delta;
}

function handleFunctionCallReady(event) {
  const { item_id } = event;
  const argsString = functionArgsBuffer.current[item_id] || "{}";
  try {
    const args = JSON.parse(argsString);
    console.log("Tool call ready:", args);

    // ✅ Now show popup based on the tool name
    if (event.name === "navigate_to") {
        setShowNavigationPopup({
          open: true,
          url: args.url
        });
      }
      
      if (event.name === "create_song") {
        setShowSongPopup({
          open: true,
          title: args.title,
          prompt: args.prompt
        });
      }
      
  } catch (err) {
    console.error("Error parsing tool arguments:", argsString, err);
  }
}

  

  const handleToolCall = (toolData) => {
    if (toolData.name === "create_song") {
      setActiveToolUI({
        type: "song",
        data: toolData.parameters,
        isLoading: false,
        onConfirm: async () => {
          setActiveToolUI((prev) => ({ ...prev, isLoading: true }));
          try {
            await triggerMusicGeneration(toolData.parameters);
            sendToolResult(toolData.call_id, { status: "success", message: "Song generated" });
            toast.success("Song generated successfully!");
          } catch (err) {
            sendToolResult(toolData.call_id, { status: "failed", message: err.message });
            toast.error("Song generation failed");
          }
          setActiveToolUI(null);
        },
        onCancel: () => {
          sendToolResult(toolData.call_id, { status: "cancelled" });
          setActiveToolUI(null);
        }
      });
    }

    if (toolData.name === "navigate_to") {
      setActiveToolUI({
        type: "navigate",
        data: toolData.parameters,
        isLoading: false,
        onConfirm: () => {
          window.open(toolData.parameters.url, "_blank");
          sendToolResult(toolData.call_id, { status: "success", message: "Navigation completed" });
          setActiveToolUI(null);
        },
        onCancel: () => {
          sendToolResult(toolData.call_id, { status: "cancelled" });
          setActiveToolUI(null);
        }
      });
    }
  };

  const sendToolResult = (toolCallId, result) => {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    dcRef.current.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "tool",
        status: "completed",
        call_id: toolCallId,
        result
      }
    }));
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

  return { status, error, startSession, stopSession, messages, isProcessing, showNavigationPopup, showSongPopup,activeToolUI };
}
