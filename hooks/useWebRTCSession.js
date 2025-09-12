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
  
  const pcRef = useRef(null);
  const audioRef = useRef(null);
  const dcRef = useRef(null);
  const localStreamRef = useRef(null);
  const isMounted = useRef(true);
  const router = useRouter();
  const lastGenerateSongCallRef = useRef(null);

  // Cooldown duration (5 minutes)
  const COOLDOWN_MS = 5 * 60 * 1000;

  const isGenerateSongOnCooldown = () => {
    if (!lastGenerateSongCallRef.current) return false;
    return Date.now() - lastGenerateSongCallRef.current < COOLDOWN_MS;
  };

  const markGenerateSongCalled = () => {
    lastGenerateSongCallRef.current = Date.now();
  };

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pcRef.current) {
      try {
        const pc = pcRef.current;
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.oniceconnectionstatechange = null;
        pc.onsignalingstatechange = null;
        pc.onicegatheringstatechange = null;
        pc.onconnectionstatechange = null;
        
        if (dcRef.current) {
          dcRef.current.onmessage = null;
          dcRef.current.onopen = null;
          dcRef.current.onclose = null;
          dcRef.current.close();
          dcRef.current = null;
        }
        
        pc.close();
      } catch (err) {
        console.error("Error during cleanup:", err);
      } finally {
        pcRef.current = null;
      }
    }

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

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  }, []);

  // Start WebRTC session
  const startSession = useCallback(async (options = {}) => {
    if (!isMounted.current) return;
    
    if (['connecting', 'connected'].includes(status)) {
      console.log('Session already active');
      return;
    }

    setStatus("connecting");
    setError(null);

    try {
      const client_secret = await getToken();
      if (!client_secret) {
        throw new Error("Failed to retrieve session token");
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.controls = false;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      audioRef.current = audioEl;

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0] && audioRef.current) {
          audioRef.current.srcObject = e.streams[0];
        }
      };

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

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

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
          console.log('📨 Received event:', data.type, data); // Debug log
          handleDataChannelEvent(data);
        } catch (err) {
          console.error('Error parsing data channel message:', err);
        }
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
        voiceActivityDetection: true
      });
      
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetchRealtime(client_secret, offer);

      if (!sdpResponse.ok) {
        if (sdpResponse.status === 401) {
          console.warn("Token expired, refreshing...");
          const newToken = await getToken(true);
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
  }, [status, cleanup]);

  const stopSession = useCallback(() => {
    if (!isMounted.current) return;
    
    setStatus('disconnecting');
    cleanup();
    setStatus('idle');
    setActiveToolUI(null);
  }, [cleanup]);

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

  // 🔥 FIXED: Handle all data channel events properly
  const handleDataChannelEvent = (data) => {
    switch (data.type) {
      // Handle text responses
      case "response.text.delta":
        if (data.delta) {
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.from === 'assistant' && lastMessage.streaming) {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, text: lastMessage.text + data.delta }
              ];
            } else {
              return [...prev, { 
                from: 'assistant', 
                text: data.delta, 
                timestamp: new Date().toISOString(),
                streaming: true 
              }];
            }
          });
        }
        break;

      case "response.text.done":
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.streaming) {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, streaming: false }
            ];
          }
          return prev;
        });
        checkForJsonCommand(data.text || "");
        break;

      // 🚀 CRITICAL: Handle tool calls correctly
      case "response.function_call_arguments.delta":
        handleFunctionArgumentsDelta(data);
        break;

      case "response.function_call_arguments.done":
        handleFunctionCallReady(data);
        break;

      // Alternative tool call format
      case "response.tool_calls.delta":
        if (data.delta && data.delta.arguments) {
          const toolCallId = data.tool_call_id || data.id;
          if (!functionArgsBuffer.current[toolCallId]) {
            functionArgsBuffer.current[toolCallId] = {
              name: data.delta.name || '',
              args: ''
            };
          }
          functionArgsBuffer.current[toolCallId].args += data.delta.arguments;
        }
        break;

      case "response.tool_calls.done":
        Object.keys(functionArgsBuffer.current).forEach(toolCallId => {
          const toolData = functionArgsBuffer.current[toolCallId];
          try {
            const args = JSON.parse(toolData.args);
            handleToolCall({
              name: toolData.name,
              parameters: args,
              call_id: toolCallId
            });
          } catch (err) {
            console.error("Error parsing tool arguments:", err);
          }
        });
        functionArgsBuffer.current = {}; // Clear buffer
        break;

      case "response.error":
        console.error("Realtime API Error:", data.error);
        setError(data.error.message);
        break;

      default:
        console.log("📋 Unhandled event:", data.type, data);
    }
  };

  // 🔧 FIXED: Function arguments handling
  function handleFunctionArgumentsDelta(event) {
    const { item_id, call_id, delta } = event;
    const id = item_id || call_id;
    
    if (!functionArgsBuffer.current[id]) {
      functionArgsBuffer.current[id] = {
        name: event.name || '',
        args: ""
      };
    }
    
    if (event.name) {
      functionArgsBuffer.current[id].name = event.name;
    }
    
    if (delta) {
      functionArgsBuffer.current[id].args += delta;
    }
    
    console.log('📝 Function args delta:', id, functionArgsBuffer.current[id]);
  }

  function handleFunctionCallReady(event) {
    const { item_id, call_id, name } = event;
    const id = item_id || call_id;
    
    const toolData = functionArgsBuffer.current[id];
    if (!toolData) {
      console.warn('No buffered args for tool call:', id);
      return;
    }

    try {
      const args = JSON.parse(toolData.args || "{}");
      console.log('🛠️ Tool call ready:', toolData.name || name, args);

      handleToolCall({
        name: toolData.name || name,
        parameters: args,
        call_id: id
      });

      // Clean up buffer
      delete functionArgsBuffer.current[id];
      
    } catch (err) {
      console.error("Error parsing tool arguments:", toolData.args, err);
    }
  }

  // 🎯 FIXED: Tool call handler
  const handleToolCall = (toolData) => {
    const { name, parameters, call_id } = toolData;
    console.log('🚀 Handling tool call:', name, parameters);

    if (name === "generate_song") {
      if (isGenerateSongOnCooldown()) {
        toast.error("⏳ Please wait 5 minutes before generating another song.");
        sendToolResult(call_id, { status: "failed", message: "Cooldown active" });
        return;
      }

      setActiveToolUI({
        type: "song",
        data: parameters,
        isLoading: false,
        onConfirm: async () => {
          setActiveToolUI((prev) => ({ ...prev, isLoading: true }));
          try {
            await triggerMusicGeneration(parameters);
            markGenerateSongCalled();
            sendToolResult(call_id, { status: "success", message: "Song generated successfully!" });
          } catch (err) {
            sendToolResult(call_id, { status: "failed", message: err.message });
          }
          setActiveToolUI(null);
        },
        onCancel: () => {
          sendToolResult(call_id, { status: "cancelled", message: "User cancelled song generation" });
          setActiveToolUI(null);
        }
      });
    }

    if (name === "navigate_to") {
      setActiveToolUI({
        type: "navigate",
        data: parameters,
        isLoading: false,
        onConfirm: () => {
          window.open(parameters.url, "_blank");
          sendToolResult(call_id, { status: "success", message: "Navigation completed" });
          setActiveToolUI(null);
        },
        onCancel: () => {
          sendToolResult(call_id, { status: "cancelled", message: "User cancelled navigation" });
          setActiveToolUI(null);
        }
      });
    }
  };

  // 📤 FIXED: Send tool result back to OpenAI
  const sendToolResult = (toolCallId, result) => {
    if (!dcRef.current || dcRef.current.readyState !== "open") {
      console.warn('Data channel not open, cannot send tool result');
      return;
    }
    
    const message = {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: toolCallId,
        output: JSON.stringify(result)
      }
    };
    
    console.log('📤 Sending tool result:', message);
    dcRef.current.send(JSON.stringify(message));
  };

  // Legacy JSON command handling (keep as backup)
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

  const triggerMusicGeneration = async (musicData) => {
    setIsProcessing(true);
    try {
      const result = await MusicGenerationAPI.generateMusic(musicData);
      console.log("✅ Music generated:", result);
      toast.success("Your AI song is ready!");
    } catch (error) {
      console.error("❌ Music generation failed:", error);
      toast.error("Failed to generate music");
      throw error; // Re-throw to handle in tool call
    } finally {
      setIsProcessing(false);
    }
  };

  return { 
    status, 
    error, 
    startSession, 
    stopSession, 
    messages, 
    isProcessing, 
    showNavigationPopup, 
    showSongPopup,
    activeToolUI 
  };
}