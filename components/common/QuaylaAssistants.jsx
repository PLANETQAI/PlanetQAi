"use client";

import { AlertCircle, Mic, MicVocal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [isMounted, setIsMounted] = useState(false);
  
  const router = useRouter();
  const mediaStreamRef = useRef(null);
  const synthesisRef = useRef(null);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isNavigatingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const shouldProcessRef = useRef(true);
  const touchTimerRef = useRef(null);
  const interactionTimeoutRef = useRef(null);
  const abortControllerRef = useRef(new AbortController());

  const videoUrl = "/videos/generator.mp4";

  // Initial mount effect
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      stopRecording();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, []);

  // Prevent carousel scroll when assistant is active
  useEffect(() => {
    const container = document.querySelector('.carousel-container');
    if (!container) return;

    const handleTouch = (e) => {
      if (isActive || isListening) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchstart', handleTouch, { passive: false, capture: true });

    return () => {
      container.removeEventListener('touchstart', handleTouch, { capture: true });
    };
  }, [isActive, isListening]);

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

  // Initialize speech synthesis and check microphone permission
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
            
            // Clear error if permission is granted
            if (permissionStatus.state === 'granted') {
              setShowPermissionError(false);
            }
            
            permissionStatus.onchange = () => {
              setMicPermission(permissionStatus.state);
              if (permissionStatus.state === 'granted') {
                setShowPermissionError(false);
              }
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
      shouldProcessRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
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
    if (!shouldProcessRef.current || isProcessing || isSpeakingRef.current) {
      console.log('⏭️ Skipping processing - stopped or busy');
      return;
    }

    setIsProcessing(true);
    console.log('🎵 Processing audio chunk...');

    try {
      if (!shouldProcessRef.current) {
        console.log('Processing stopped by user');
        return;
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const wavBlob = audioBufferToWav(audioBuffer);

      const formData = new FormData();
      formData.append('audio', wavBlob, 'chunk.wav');

      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        body: formData,
        signal,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
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
      if (error.name !== 'AbortError') {
        console.error('❌ Error processing audio:', error);
      }
    } finally {
      if (shouldProcessRef.current) {
        setIsProcessing(false);
      }
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

  const stopRecording = useCallback(() => {
    if (!isMounted) return;

    shouldProcessRef.current = false;
    setIsProcessing(false);

    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      try {
        abortControllerRef.current.abort();
      } catch (error) {
        console.log('Cleanup - abort already in progress');
      }
    }
    abortControllerRef.current = new AbortController();

    console.log('🛑 Stopping recording...');
    clearTimeout(interactionTimeoutRef.current);
    setIsListening(false);

    // Clean up audio processing
    if (audioProcessorRef.current) {
      try {
        audioProcessorRef.current.port.postMessage('stop');
        audioProcessorRef.current.disconnect();
      } catch (error) {
        console.log('Cleanup - audio processor already disconnected');
      }
      audioProcessorRef.current = null;
    }

    // Clean up media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
  }, [isMounted]);

  // Touch event handlers for mobile
  const handleTouchStart = () => {
    if (!isActive) {
      touchTimerRef.current = setTimeout(() => {
        startAssistant();
      }, 300);
    } else {
      setTouchActive(true);
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(touchTimerRef.current);
    setTouchActive(false);
  };

  // Clean up all resources when component unmounts
  useEffect(() => {
    return () => {
      clearTimeout(touchTimerRef.current);
      clearTimeout(interactionTimeoutRef.current);

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, []);

  const startAssistant = async () => {
    console.log('🚀 Starting assistant...');
    
    // If permission is denied, show error and exit early
    if (micPermission === 'denied') {
      setStatus('Microphone access denied');
      setShowPermissionError(true);
      return;
    }

    // Set active state immediately for UI feedback
    setIsActive(true);
    setStatus('Initializing...');
    setTranscript('');
    setShowPermissionError(false);
    setWelcomeFinished(false);
    isNavigatingRef.current = false;
    isSpeakingRef.current = false;
    shouldProcessRef.current = true;

    try {
      // Get the microphone stream
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
          ...(isMobile && {
            latency: 0.1,
            echoCancellationType: 'system',
            suppressLocalAudioPlayback: true,
            sampleSize: 16
          })
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      setMicPermission('granted');
      setShowPermissionError(false); // Clear any previous errors

      // Initialize audio processing with the stream
      const processingInitialized = await initAudioProcessing(stream);
      if (!processingInitialized) {
        throw new Error('Failed to initialize audio processing');
      }

      setIsListening(true);
      setStatus(isMobile ? 'Listening...' : 'Listening continuously... Speak naturally!');

      // Mobile-specific timeout
      if (isMobile) {
        interactionTimeoutRef.current = setTimeout(() => {
          if (isListening) stopAssistant();
        }, 30000);
      }

      // Start welcome video
      if (!welcomeFinished && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = isMobile;
        videoRef.current.playsInline = true;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(err => console.warn('⚠️ Video autoplay prevented:', err));
      }
    } catch (error) {
      console.error('❌ Failed to start assistant:', error);
      setMicPermission('denied');
      setShowPermissionError(true);
      setStatus('Microphone access is required');
      setIsActive(false);
      stopRecording();
    }
  };

  const stopAssistant = useCallback(() => {
    console.log('🛑 Stopping assistant...');
    shouldProcessRef.current = false;
    isSpeakingRef.current = false;
    
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
  }, [stopRecording]);

  const toggleListening = useCallback(() => {
    if (isActive) {
      console.log('🛑 Toggling off...');
      stopAssistant();
    } else {
      console.log('🎤 Toggling on...');
      startAssistant();
    }
  }, [isActive, stopAssistant]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActive) {
        stopAssistant();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 relative overflow-hidden rounded-sm shadow-lg">
      <div className="relative z-10 flex flex-col items-center w-full px-4 sm:px-6 max-w-2xl mx-auto">
        <h1 
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 text-center leading-tight"
          style={{
            fontFamily: 'cursive',
            color: '#00d4ff',
            textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
            letterSpacing: '1px',
            lineHeight: '1.2'
          }}
        >
          Planet Q<br className="sm:hidden" /> Productions
        </h1>

        <h2 
          className="text-xl sm:text-2xl md:text-3xl mb-6 sm:mb-8 text-center"
          style={{
            fontFamily: 'cursive',
            color: '#ff00ff',
            textShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
            letterSpacing: '0.5px',
            lineHeight: '1.3'
          }}
        >
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
          <div 
            className={`absolute inset-0 rounded-full transition-all duration-300 ${
              pulseAnimation ? 'animate-ping' : ''
            }`}
            style={{
              background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)',
              transform: 'scale(1.2)'
            }} 
          />

          <div
            className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-purple-500/30"
            style={{
              background: 'radial-gradient(circle at center, rgba(30,30,60,0.9), rgba(10,10,30,0.95))',
              boxShadow: isActive
                ? '0 0 60px rgba(0,212,255,0.6), inset 0 0 40px rgba(0,100,150,0.3)'
                : '0 0 30px rgba(0,212,255,0.3), inset 0 0 20px rgba(0,100,150,0.2)'
            }}
          >
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
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleListening();
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                disabled={micPermission === 'denied'}
                className={`relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50'
                    : micPermission === 'denied'
                    ? 'bg-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-cyan-500/50'
                }`}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  transform: `${isActive ? 'scale(1.1)' : 'scale(1)'}`,
                  transition: 'transform 150ms ease, background 200ms ease',
                  userSelect: 'none',
                  zIndex: 50,
                  pointerEvents: micPermission === 'denied' ? 'none' : 'auto'
                }}
                aria-label={isActive ? 'Stop voice assistant' : 'Start voice assistant'}
              >
                {isActive ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <MicVocal className="w-7 h-7 md:w-8 md:h-8" />
                    <div className="absolute inset-0 rounded-full opacity-20 bg-red-400 animate-ping"></div>
                  </div>
                ) : micPermission === 'denied' ? (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <AlertCircle size={24} className="text-white" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <Mic className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                )}

                {/* Visual feedback for touch devices */}
                {touchActive && (
                  <span className="absolute inset-0 rounded-full bg-white/20"></span>
                )}
              </button>

              {/* Status indicator */}
              <div
                className={`absolute left-1/2 -bottom-8 transform -translate-x-1/2 w-full text-center text-sm font-medium transition-all duration-200 ${
                  isActive ? 'opacity-100 text-white' : 'opacity-0 text-gray-300'
                } whitespace-nowrap`}
              >
                {status}
              </div>
            </div>
          </div>
        </div>

        <h3 
          className="text-2xl md:text-3xl mb-6 text-center"
          style={{
            fontFamily: 'cursive',
            color: '#ff00ff',
            textShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
            letterSpacing: '1px'
          }}
        >
          Music Creation
        </h3>

        <h4 
          className="text-3xl md:text-4xl mb-8 text-center"
          style={{
            fontFamily: 'cursive',
            color: '#00d4ff',
            textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
            letterSpacing: '2px'
          }}
        >
          AI Radio Station
        </h4>
      </div>
    </div>
  );
};

export default VoiceNavigationAssistant;