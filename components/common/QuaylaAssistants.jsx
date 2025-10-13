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

  const videoUrl = "/videos/generator_final.mp4";

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

  // Check microphone permission function
  const checkMicrophonePermission = useCallback(async () => {
    try {
      // First check if we can query the permission state without triggering the prompt
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
          
          const updatePermissionState = () => {
            const state = permissionStatus.state;
            setMicPermission(state);
            setShowPermissionError(state === 'denied');
            return state;
          };
          
          const currentState = updatePermissionState();
          
          // If we already have permission, no need to request it
          if (currentState === 'granted') {
            return 'granted';
          }
          
          permissionStatus.onchange = updatePermissionState;
          
          // If permission is denied, don't try to request it
          if (currentState === 'denied') {
            return 'denied';
          }
        } catch (error) {
          console.log('Permissions API query failed, falling back to basic check');
        }
      }
      
      // If we get here, either Permissions API is not supported or permission is 'prompt'
      try {
        // This will trigger the permission prompt if not already granted/denied
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setMicPermission('granted');
        setShowPermissionError(false);
        return 'granted';
      } catch (error) {
        console.log('Microphone permission denied or not available', error);
        setMicPermission('denied');
        setShowPermissionError(true);
        return 'denied';
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setMicPermission('denied');
      setShowPermissionError(true);
      return 'denied';
    }
  }, []);

  // Check and request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      // This will trigger the permission prompt if not already granted/denied
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      setShowPermissionError(false);
      return true;
    } catch (error) {
      console.log('Microphone permission denied or not available', error);
      setMicPermission('denied');
      setShowPermissionError(true);
      return false;
    }
  }, []);

  // Initialize speech synthesis and check microphone permission
  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
    
    // Check if we should retry permission on page load
    const retryPermission = localStorage.getItem('retryMicrophonePermission') === 'true';
    
    if (retryPermission) {
      localStorage.removeItem('retryMicrophonePermission');
      requestMicrophonePermission().then(granted => {
        if (granted && isActive) {
          startAssistant();
        }
      });
    } else {
      checkMicrophonePermission();
    }

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
  }, [checkMicrophonePermission, isActive, requestMicrophonePermission]);

  // Check permission when active state changes
  useEffect(() => {
    checkMicrophonePermission();
  }, [isActive, checkMicrophonePermission]);

  // Set flag to retry permission on next page load if currently denied
  useEffect(() => {
    if (micPermission === 'denied' && isMounted) {
      localStorage.setItem('retryMicrophonePermission', 'true');
    }
  }, [micPermission, isMounted]);

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

    // Set initial UI state
    setIsActive(true);
    setStatus('Initializing...');
    setTranscript('');
    setShowPermissionError(false);
    setWelcomeFinished(false);
    isNavigatingRef.current = false;
    isSpeakingRef.current = false;
    shouldProcessRef.current = true;

    try {
      // Check current permission state
      const permissionState = await checkMicrophonePermission();
      
      if (permissionState === 'denied') {
        setStatus('Microphone access denied. Please enable it in your browser settings.');
        setShowPermissionError(true);
        setIsActive(false);
        return;
      }

      // Get the microphone stream with optimized settings
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

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        mediaStreamRef.current = stream;
        setMicPermission('granted');
        setShowPermissionError(false);

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
          videoRef.current.play().catch(err => 
            console.warn('⚠️ Video autoplay prevented:', err)
          );
        }
      } catch (error) {
        console.error('❌ Failed to access microphone:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setStatus('Microphone access was denied. Please check your browser settings.');
          setMicPermission('denied');
          setShowPermissionError(true);
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setStatus('No microphone found. Please connect a microphone and try again.');
          setShowPermissionError(true);
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          setStatus('Microphone is already in use by another application.');
          setShowPermissionError(true);
        } else {
          setStatus('Failed to access microphone. Please try again.');
          setShowPermissionError(true);
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Failed to start assistant:', error);
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


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActive) {
        stopAssistant();
      }
    };
  }, []);


  // const requestMicrophonePermission = useCallback(async () => {
  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //     // Stop all tracks to release the microphone immediately
  //     stream.getTracks().forEach(track => track.stop());
  //     setMicPermission('granted');
  //     setShowPermissionError(false);
  //     return true;
  //   } catch (error) {
  //     console.error('Microphone access denied:', error);
  //     setMicPermission('denied');
  //     setShowPermissionError(true);
  //     setStatus('Microphone access denied');
  //     return false;
  //   }
  // }, []);

  // Handle start button click
  const handleStartListening = useCallback(async (e) => {
    e?.stopPropagation();

    if (micPermission === 'denied') {
      setShowPermissionError(true);
      return;
    }

    if (micPermission !== 'granted') {
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) return;
    }

    console.log('🎤 Starting voice assistant...');
    await startAssistant();
  }, [micPermission, requestMicrophonePermission, startAssistant]);

  // Handle stop button click
  const handleStopListening = useCallback((e) => {
    e?.stopPropagation();
    console.log('🛑 Stopping voice assistant...');
    stopAssistant();
  }, [stopAssistant]);


  return (
    <div className="flex bg-[#17101d9c] flex-col items-center justify-center p-4 relative overflow-hidden rounded-sm shadow-lg">
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

        {showPermissionError && micPermission === 'denied' && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex flex-col gap-3 max-w-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-red-200">
                <p className="font-semibold mb-1">Microphone Access Required</p>
                <p className="mb-3">Please enable microphone permissions to use voice commands.</p>
                <button
                  onClick={async () => {
                    try {
                      // First try to check the permission state
                      const permission = await checkMicrophonePermission();
                      
                      if (permission === 'granted') {
                        setMicPermission('granted');
                        setShowPermissionError(false);
                        if (isActive) {
                          startAssistant();
                        }
                        return;
                      }
                      
                      // If we get here, permission is still not granted
                      // Direct user to browser settings
                      if (navigator.permissions) {
                        setStatus('Please enable microphone access in your browser settings.');
                      } else {
                        // Fallback for browsers that don't support Permissions API
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        stream.getTracks().forEach(track => track.stop());
                        setMicPermission('granted');
                        setShowPermissionError(false);
                        if (isActive) {
                          startAssistant();
                        }
                      }
                    } catch (error) {
                      console.error('Failed to get microphone permission:', error);
                      setStatus('Please enable microphone access in your browser settings.');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  {navigator.permissions ? 'Open Browser Settings' : 'Try Again'}
                </button>
              </div>
            </div>
            <div className="text-xs text-red-300 mt-1">
              <p>Please allow microphone access in your browser settings to use voice commands.</p>
              {navigator.permissions && (
                <p className="mt-1">Look for the microphone icon in your browser's address bar and allow access.</p>
              )}
            </div>
          </div>
        )}

        <div className="relative mb-8">
          <div
            className={`absolute inset-0 rounded-full transition-all duration-300 ${pulseAnimation ? 'animate-ping' : ''
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
              autoPlay
              loop
              muted
              playsInline
              onEnded={() => {
                console.log('✅ Welcome video finished');
                setWelcomeFinished(true);
                setStatus('Ready! Listening continuously...');
              }}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {isListening && (
              <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
            )}
          </div>

          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              {isActive ? (
                <button
                  onClick={handleStopListening}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg bg-red-500 hover:bg-red-600 shadow-red-500/50 transition-all duration-300"
                  style={{
                    userSelect: 'none',
                    zIndex: 50
                  }}
                  aria-label="Stop voice assistant"
                >
                  <div className="flex items-center justify-center w-full h-full">
                    <MicVocal className="w-7 h-7 md:w-8 md:h-8" />
                    <div className="absolute inset-0 rounded-full opacity-20 bg-red-400 animate-ping"></div>
                  </div>
                  {touchActive && (
                    <span className="absolute inset-0 rounded-full bg-white/20"></span>
                  )}
                </button>
              ) : micPermission === 'denied' ? (
                <div className="relative group">
                  <button
                    onClick={() => setShowPermissionError(true)}
                    className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-500 cursor-not-allowed opacity-50"
                    aria-label="Microphone access denied"
                    disabled
                  >
                    <AlertCircle size={24} className="text-white" />
                  </button>
                  <div className="absolute left-1/2 -bottom-8 transform -translate-x-1/2 w-48 text-center text-sm text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Microphone access denied
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleStartListening}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-cyan-500/50 transition-all duration-300"
                  style={{
                    userSelect: 'none',
                    zIndex: 50
                  }}
                  aria-label="Start voice assistant"
                >
                  <Mic className="w-6 h-6 md:w-7 md:h-7" />
                  {touchActive && (
                    <span className="absolute inset-0 rounded-full bg-white/20"></span>
                  )}
                </button>
              )}

              {/* Status indicator */}
              {/* <div
                className={`absolute left-1/2 -bottom-8 transform -translate-x-1/2 w-full text-center text-sm font-medium transition-all duration-200 ${isActive ? 'opacity-100 text-white' : 'opacity-0 text-gray-300'
                  } whitespace-nowrap`}
              >
                {status}
              </div> */}
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