// utils/voiceAssistant/webrtcHelpers.js
export class WebRTCHelper {
    static async initializePeerConnection(ephemeralKey) {
      const peer = new RTCPeerConnection();
  
      // Create audio element for playback
      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      
      peer.ontrack = (e) => {
        audioElement.srcObject = e.streams[0];
      };
  
      // Get user media
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
  
      // Create data channel
      const dataChannel = peer.createDataChannel("oai-events");
  
      // Create and set local description
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
  
      // Send offer to OpenAI
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });
  
      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
  
      await peer.setRemoteDescription(answer);
  
      return { peer, dataChannel, audioElement };
    }
  
    static setupDataChannelHandlers(dataChannel, systemInstructions, onMessage) {
      dataChannel.addEventListener("open", () => {
        console.log("🔔 DataChannel is open!");
        
        // Send session configuration
        dataChannel.send(JSON.stringify({
          type: "session.update",
          session: {
            instructions: systemInstructions,
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 200
            }
          },
        }));
      });
  
      dataChannel.addEventListener("message", onMessage);
    }
  }