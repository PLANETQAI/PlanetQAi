"use client";

import { getToken } from "@/lib/openai/token";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { MusicGenerationAPI } from "@/utils/voiceAssistant/apiHelpers";
import { runtime } from "@/utils/voiceAssistant/runtime";

export function useWebRTCSession() {
  const functionArgsBuffer = useRef({}); // Keep partial arguments
  const [generationStatus, setGenerationStatus] = useState(null); // pending | processing | completed | failed
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
  const [cooldownUntil, setCooldownUntil] = useState(null);

  const isGenerateSongOnCooldown = () => {
    if (!cooldownUntil) return false;
    return Date.now() < cooldownUntil;
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
      
      // dc.onmessage = (event) => {
      //   try {
      //     const data = JSON.parse(event.data);
      //     console.log('📨 Received event:', data.type, data); // Debug log
      //     handleDataChannelEvent(data);
      //   } catch (err) {
      //     console.error('Error parsing data channel message:', err);
      //   }
      // };

      dc.onmessage = async (event) => {
        const data = JSON.parse(event.data);
      
        switch (data.type) {
          case "response.function_call_arguments.delta": {
            const { tool_call_id, delta } = data;
            if (!functionArgsBuffer.current[tool_call_id]) {
              functionArgsBuffer.current[tool_call_id] = { args: "" };
            }
            functionArgsBuffer.current[tool_call_id].args += delta;
            break;
          }
      
          case "response.tool_calls.done": {
            const { tool_call_id, name } = data;
            const argsStr = functionArgsBuffer.current[tool_call_id]?.args || "{}";
            let args = {};
            try {
              args = JSON.parse(argsStr);
            } catch (e) {
              console.error("Failed to parse tool args:", e);
            }
      
            // 🚀 Runtime handles the tool call
            await handleToolCall({
              name,
              parameters: args,
              call_id: tool_call_id,
            });
      
            delete functionArgsBuffer.current[tool_call_id];
            break;
          }
      
          default:
            console.log("Unhandled event:", data);
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

  const handleToolCall = async ({ name, parameters, call_id }) => {
    console.log("🚀 Tool call received:", name, parameters);
  
    try {
      // Let AgentRuntime execute the tool
      const result = await runtime.executeTool(name, parameters);
  
      // ✅ Send result back
      sendToolResult(call_id, result);
    } catch (err) {
      console.error("❌ Tool execution failed:", err);
      sendToolResult(call_id, { status: "error", message: err.message });
    }
  };
  
   const sendMessage = (text) => {
    if (!dcRef.current || dcRef.current.readyState !== "open") {
      console.warn("⚠️ Data channel not open, cannot send message");
      return;
    }

    // Append buffer
    dcRef.current.send(
      JSON.stringify({
        type: "input_text_buffer.append",
        text,
      })
    );

    // Commit buffer (finalize message)
    dcRef.current.send(
      JSON.stringify({
        type: "input_text_buffer.commit",
      })
    );
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


const sendToolResult = (toolCallId, result) => {
  if (!dcRef.current || dcRef.current.readyState !== "open") {
    console.warn("⚠️ Data channel not open, cannot send tool result");
    return;
  }

  const message = {
    type: "conversation.item.create",
    item: {
      type: "function_call_output",
      call_id: toolCallId,
      output: JSON.stringify(result), // must be stringified
    },
  };

  console.log("📤 Sending tool result:", message);
  dcRef.current.send(JSON.stringify(message));
};


  const triggerMusicGeneration = async (musicData, onStatusUpdate) => {
    if (isGenerateSongOnCooldown()) {
      const errorMsg = "⏳ Please wait before generating another song.";
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  
    setIsProcessing(true);
    const updateStatus = (status) => {
      setGenerationStatus(status);
      if (onStatusUpdate) onStatusUpdate(status);
    };
  
    try {
      updateStatus("pending");
      
      const result = await MusicGenerationAPI.generateMusic(musicData, (status) => {
        updateStatus(status.status);
      });
  
      console.log("✅ Music generation result:", result);
      toast.success("Your AI song is ready!");
      updateStatus("completed");
      
      return result;
    } catch (error) {
      console.error("❌ Music generation failed:", error);
      toast.error(error.message || "Failed to generate music");
      updateStatus("failed");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  const sendSongRequest = (title, prompt) => {
    const text = `Create a song titled "${title}" with this idea: ${prompt}`;
    sendMessage(text);
  };
  const sendNavigationRequest = (url) => {
    const text = `Take me to ${url}`;
    sendMessage(text);
  };
    

  return { 
    status, 
    error, 
    startSession, 
    stopSession, 
    generationStatus,
    messages, 
    isProcessing, 
    showNavigationPopup, 
    showSongPopup,
    activeToolUI,
    sendMessage,
    triggerMusicGeneration,
    sendSongRequest,
    sendNavigationRequest,
  };
}