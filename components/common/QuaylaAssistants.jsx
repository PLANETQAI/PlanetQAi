"use client";

import { AlertCircle, Dot, MicOff, MicVocal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const VoiceNavigationAssistant = () => {
  // State for mobile optimization
  const [isMobile, setIsMobile] = useState(false);
  const [touchActive, setTouchActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Tap to activate');
  const [isActive, setIsActive] = useState(false);
  const [micPermission, setMicPermission] = useState('prompt');
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [welcomeFinished, setWelcomeFinished] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const router = useRouter();
  const mediaStreamRef = useRef(null);
  const synthesisRef = useRef(null);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isNavigatingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const touchTimerRef = useRef(null);
  const interactionTimeoutRef = useRef(null);

  const videoUrl = "/videos/generator.mp4";

  // Detect mobile devices
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;

    const checkMicrophonePermission = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ 
            name: 'microphone' 
          }).catch(() => null);
          
          if (permissionStatus) {
            setMicPermission(permissionStatus.state);
            permissionStatus.onchange = () => {
              setMicPermission(permissionStatus.state);
            };
            return;
          }
        } catch (error) {
          console.log('Permissions API not available');
        }
      }
    };

    checkMicrophonePermission();

    return () => {
      stopRecording();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  const speak = (text) => {
    return new Promise((resolve) => {
      console.log('🔊 Speaking:', text);
      
      if (!synthesisRef.current) {
        resolve();
        return;
      }
      
      synthesisRef.current.cancel();
      isSpeakingRef.current = true;
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = 'en-US';
        
        utterance.onstart = () => {
          console.log('🗣️ Speech started');
          setPulseAnimation(true);
        };
        
        utterance.onend = () => {
          console.log('✅ Speech ended');
          setPulseAnimation(false);
          isSpeakingRef.current = false;
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('❌ Speech error:', event.error);
          setPulseAnimation(false);
          isSpeakingRef.current = false;
          resolve();
        };
        
        synthesisRef.current.speak(utterance);
      }, 150);
    });
  };

  const processAudioChunk = async (audioBuffer) => {
    // Don't process if we're navigating or already processing
    if (isNavigatingRef.current || isProcessing || isSpeakingRef.current) {
      console.log('⏭️ Skipping processing - busy');
      return;
    }

    setIsProcessing(true);
    console.log('🎵 Processing audio chunk...');
    
    try {
      const wavBlob = audioBufferToWav(audioBuffer);
      
      const formData = new FormData();
      formData.append('audio', wavBlob, 'chunk.wav');
      formData.append('streaming', 'true');
      
      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        console.error('❌ Transcription failed');
        setIsProcessing(false);
        return;
      }
      
      const result = await response.json();
      
      if (result.text && result.text.trim()) {
        console.log('📝 Transcribed:', result.text);
        setTranscript(prev => {
          const newText = prev ? prev + ' ' + result.text : result.text;
          return newText;
        });
        
        // Check if navigation command was detected
        if (result.navigation) {
          console.log('🎯 Navigation detected:', result.navigation.action);
          isNavigatingRef.current = true;
          
          if (result.navigation.action === 'navigate') {
            console.log('🧭 Navigating to:', result.navigation.route);
            setStatus(result.navigation.message);
            
            // Speak and then navigate
            await speak(result.navigation.message);
            
            // Stop everything
            stopAssistant();
            
            // Navigate after a short delay
            setTimeout(() => {
              router.push(`/${result.navigation.route}`);
            }, 500);
            
          } else if (result.navigation.action === 'exit') {
            setStatus(result.navigation.message);
            await speak(result.navigation.message);
            stopAssistant();
            
          } else if (result.navigation.action === 'greeting' || result.navigation.action === 'help') {
            setStatus('Listening for your command...');
            await speak(result.navigation.message);
            // Continue listening after greeting/help
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error processing audio:', error);
    } finally {
      setIsProcessing(false);
      console.log('✅ Processing complete - ready for next chunk');
    }
  };

  const audioBufferToWav = (audioBuffer) => {
    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    const buffer = new ArrayBuffer(44 + audioBuffer.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioBuffer.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, audioBuffer.length * 2, true);
    
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const initAudioProcessing = async (stream) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create a gain node to prevent feedback - mute the output
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0; // Mute the microphone input playback
      
      audioProcessorRef.current = new AudioWorkletNode(
        audioContextRef.current,
        'audio-processor'
      );
      
      audioProcessorRef.current.port.onmessage = (event) => {
        if (event.data.type === 'audioData' && !isNavigatingRef.current) {
          const audioData = new Float32Array(event.data.audioData);
          audioChunksRef.current.push(audioData);
          
          console.log(`📊 Buffer chunks: ${audioChunksRef.current.length}/2`);
          
          // Process every 2 seconds of audio (2 chunks)
          if (audioChunksRef.current.length >= 2) {
            console.log('🔄 Combining chunks for processing...');
            
            const combinedBuffer = new Float32Array(
              audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0)
            );
            
            let offset = 0;
            audioChunksRef.current.forEach(chunk => {
              combinedBuffer.set(chunk, offset);
              offset += chunk.length;
            });
            
            // Clear the chunks for next collection
            audioChunksRef.current = [];
            
            // Process the audio
            processAudioChunk(combinedBuffer);
          }
        }
      };
      
      // Connect with gain node to prevent feedback
      source.connect(audioProcessorRef.current);
      audioProcessorRef.current.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      console.log('✅ Audio processing initialized (feedback prevention enabled)');
      return true;
      
    } catch (error) {
      console.error('❌ Error initializing audio:', error);
      return false;
    }
  };

  const startRecording = async () => {
    console.log('🎙️ Starting recording...');
    
    if (micPermission === 'denied') {
      setStatus('Microphone access denied');
      setShowPermissionError(true);
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      
      mediaStreamRef.current = stream;
      setMicPermission('granted');
      setShowPermissionError(false);
      
      await initAudioProcessing(stream);
      
      setIsListening(true);
      setStatus('Listening continuously... Speak naturally!');
      
      if (!welcomeFinished && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = false;
        videoRef.current.play().catch(err => {
          console.warn('⚠️ Video autoplay prevented:', err);
        });
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Microphone error:', error);
      setMicPermission('denied');
      setShowPermissionError(true);
      setIsActive(false);
      return false;
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping recording...');
    
    setIsListening(false);
    
    if (audioProcessorRef.current) {
      audioProcessorRef.current.port.postMessage('stop');
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.suspend();
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    audioChunksRef.current = [];
  };

  const startAssistant = async () => {
    console.log('🚀 Starting assistant...');
    
    if (micPermission !== 'granted') {
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) return;
    }

    setIsActive(true);
    setTranscript('');
    setShowPermissionError(false);
    setWelcomeFinished(false);
    isNavigatingRef.current = false;
    isSpeakingRef.current = false;
    
    await startRecording();
  };

  const stopAssistant = () => {
    console.log('🛑 Stopping assistant...');
    
    stopRecording();
    
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
    
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    setIsActive(false);
    setTranscript('');
    setStatus('Click to activate voice assistant');
    setPulseAnimation(false);
    isNavigatingRef.current = false;
    isSpeakingRef.current = false;
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      setShowPermissionError(false);
      return true;
    } catch (error) {
      console.error('❌ Permission denied:', error);
      setMicPermission('denied');
      setShowPermissionError(true);
      setStatus('Microphone access denied');
      return false;
    }
  };

  const toggleListening = async () => {
    if (isActive) {
      stopAssistant();
      return;
    }

    if (micPermission === 'denied') {
      setStatus('Microphone access denied');
      setShowPermissionError(true);
      return;
    }

    setStatus('Requesting microphone access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      setShowPermissionError(false);
      startAssistant();
      
    } catch (error) {
      console.error('❌ Permission error:', error);
      setMicPermission('denied');
      setShowPermissionError(true);
      setStatus('Microphone access is required');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#141432] to-[#0a0e27] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center"
            style={{
              fontFamily: 'cursive',
              color: '#00d4ff',
              textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
              letterSpacing: '2px'
            }}>
          Planet Q Productions
        </h1>

        <h2 className="text-2xl md:text-3xl mb-8 text-center"
            style={{
              fontFamily: 'cursive',
              color: '#ff00ff',
              textShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
              letterSpacing: '1px'
            }}>
          Q_World Studios
        </h2>

        {showPermissionError && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3 max-w-md">
            <AlertCircle className="text-red-400 flex-shrink-0" size={24} />
            <div className="text-sm text-red-200">
              <p className="font-semibold mb-1">Microphone Access Required</p>
              <p>Please enable microphone permissions in your browser settings.</p>
            </div>
          </div>
        )}

        <div className="relative mb-8">
          <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
            pulseAnimation ? 'animate-ping' : ''
          }`}
               style={{
                 background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)',
                 transform: 'scale(1.2)'
               }} />
          
          <div 
            className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-purple-500/30"
            style={{
              background: 'radial-gradient(circle at center, rgba(30,30,60,0.9), rgba(10,10,30,0.95))',
              boxShadow: isActive 
                ? '0 0 60px rgba(0,212,255,0.6), inset 0 0 40px rgba(0,100,150,0.3)' 
                : '0 0 30px rgba(0,212,255,0.3), inset 0 0 20px rgba(0,100,150,0.2)'
            }}>
            
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              loop={false}
              playsInline
              onEnded={() => {
                console.log('✅ Welcome video finished');
                setWelcomeFinished(true);
                setStatus('Ready! Listening continuously...');
              }}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>

            {isListening && (
              <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
            )}
          </div>

          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-cyan-500 shadow-lg shadow-cyan-500/50'
            }`}>
              <Dot className="text-white" size={24} />
            </div>
          </div>
        </div>

        <h3 className="text-2xl md:text-3xl mb-6 text-center"
            style={{
              fontFamily: 'cursive',
              color: '#ff00ff',
              textShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
              letterSpacing: '1px'
            }}>
          Music Creation
        </h3>

        <h4 className="text-3xl md:text-4xl mb-8 text-center"
            style={{
              fontFamily: 'cursive',
              color: '#00d4ff',
              textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
              letterSpacing: '2px'
            }}>
          AI Radio Station
        </h4>

        <button
          onClick={toggleListening}
          disabled={micPermission === 'denied'}
          className={`mb-6 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
            isActive 
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50' 
              : micPermission === 'denied'
              ? 'bg-gray-500 cursor-not-allowed opacity-50'
              : 'bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/50'
          }`}
          style={{
            color: 'white',
            transform: isActive ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          {isActive ? (
            <div className="flex flex-col items-center gap-1">
              <MicOff size={16} />
              <span className="text-xs">Stop</span>
            </div>
          ) : micPermission === 'denied' ? (
            <div className="flex flex-col items-center gap-1">
              <AlertCircle size={16} />
              <span className="text-xs">Denied</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <MicVocal size={16} />
              <span className="text-xs">Activate</span>
            </div>
          )}
        </button>

        {/* <div className="w-full max-w-md p-6 rounded-lg bg-black/30 backdrop-blur-sm border border-cyan-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              isListening ? 'bg-red-500 animate-pulse' : 
              pulseAnimation ? 'bg-cyan-500 animate-pulse' : 
              'bg-gray-500'
            }`} />
            <p className="text-cyan-300 font-semibold">
              {isListening ? 'Listening Continuously' :
               pulseAnimation ? 'Speaking...' : 
               'Standby'}
            </p>
          </div>
          
          <p className="text-gray-300 text-sm mb-3">{status}</p>
          
          {transcript && (
            <div className="mt-3 pt-3 border-t border-cyan-500/30">
              <p className="text-xs text-gray-400 mb-1">Live Transcription:</p>
              <p className="text-cyan-200 min-h-[20px]">{transcript}</p>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-cyan-500/30">
            <p className="text-xs text-gray-400 text-center">
              💬 Speak naturally - I'm always listening!
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default VoiceNavigationAssistant;