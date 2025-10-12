"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Mic, MicOff, Volume2 } from 'lucide-react';

const VoiceNavigationAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Click to activate voice assistant');
  const [isActive, setIsActive] = useState(false);
  const [micPermission, setMicPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [welcomeFinished, setWelcomeFinished] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  
  const router = useRouter();
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const synthesisRef = useRef(null);
  const videoRef = useRef(null);
  const utteranceRef = useRef(null);
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const isProcessingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // 1 second
  const silenceTimerRef = useRef(null);

  // Replace this with your actual video URL
  const videoUrl = "/videos/generator.mp4";

  // Navigation routes mapping
  const navigationMap = {
    games: ['play games', 'games', 'game', 'play', 'gaming', 'start game'],
    aistudio: ['create song', 'music', 'ai studio', 'studio', 'create music', 'make song', 'compose', 'create', 'generate song'],
    'productions/album': ['listen to songs', 'check my songs', 'my songs', 'my album', 'my music'],
    productions: ['listen to radio', 'radio', 'ai radio', 'radio station'],
    'video-player': ['video', 'videos', 'gallery', 'watch video', 'video player', 'my videos'],
    home: ['home', 'main page', 'homepage', 'go home', 'start', 'main menu'],
    about: ['about', 'about us', 'information', 'who are you'],
    contact: ['contact', 'reach out', 'get in touch', 'contact us', 'support']
  };

  // Initialize WebSocket connection
  const initWebSocket = useCallback(() => {
    // Don't initialize if already connecting/connected
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Use the same protocol as the current page for WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/speech/ws`;
    
    console.log('🔌 Connecting to WebSocket...', wsUrl);
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('✅ WebSocket connected');
      reconnectAttemptsRef.current = 0;
      setStatus('Connected. Click to start speaking.');
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📩 WebSocket message:', data);
        
        if (data.type === 'transcription' && data.text) {
          handleTranscription(data.text);
        } else if (data.type === 'error') {
          console.error('Server error:', data.message);
          setStatus(`Error: ${data.message}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    wsRef.current.onclose = (event) => {
      console.log(`WebSocket closed: ${event.code} ${event.reason || 'No reason provided'}`);
      
      // Only attempt to reconnect if we're still active and haven't exceeded max attempts
      if (isActive && reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;
        console.log(`♻️ Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
        
        setTimeout(() => {
          if (isActive) {
            initWebSocket();
          }
        }, delay);
      } else if (isActive) {
        console.error('❌ Max reconnection attempts reached');
        setStatus('Connection lost. Please refresh the page.');
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [isActive]);

  // Initialize WebSocket connection on mount and clean up on unmount
  useEffect(() => {
    if (typeof WebSocket !== 'undefined') {
      initWebSocket();
      
      return () => {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    } else {
      console.error('WebSocket is not supported in this browser');
      setStatus('WebSocket is not supported in your browser');
    }
  }, [initWebSocket]);

  // Start/stop recording when isActive changes
  useEffect(() => {
    if (isActive && wsRef.current?.readyState === WebSocket.OPEN) {
      startRecording();
    } else if (!isActive) {
      stopRecording();
    }
  }, [isActive]);

  // Handle transcription results
  const handleTranscription = async (text) => {
    if (!text.trim()) return;
    
    console.log('🎤 Transcribed text:', text);
    setTranscript(text);
    await processCommand(text.toLowerCase().trim());
  };

  // Process audio data and send to WebSocket
  const processAudioData = (audioData) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;
    
    // Convert audio data to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64Audio = reader.result.split(',')[1];
      wsRef.current.send(JSON.stringify({
        type: 'audio',
        audio: `data:audio/webm;base64,${base64Audio}`
      }));
      isProcessingRef.current = false;
    };
    reader.readAsDataURL(new Blob([audioData], { type: 'audio/webm' }));
  };

  // Initialize audio context and processor
  const initAudioProcessing = async (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      audioProcessorRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
      
      audioProcessorRef.current.port.onmessage = (event) => {
        if (event.data.type === 'audioData') {
          processAudioData(event.data.audioData);
        }
      };
      
      source.connect(audioProcessorRef.current);
      audioProcessorRef.current.connect(audioContextRef.current.destination);
      
    } catch (error) {
      console.error('Error initializing audio processing:', error);
      // Fallback to MediaRecorder if AudioWorklet is not supported
      startMediaRecorder(stream);
    }
  };

  // Fallback to MediaRecorder if AudioWorklet is not available
  const startMediaRecorder = (stream) => {
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    audioChunksRef.current = [];
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        processAudioData(event.data);
      }
    };
    
    mediaRecorderRef.current.start(1000); // Collect data every second
  };

  useEffect(() => {
    // Initialize Speech Synthesis for text-to-speech
    synthesisRef.current = window.speechSynthesis;

    // Check microphone permission status
    const checkMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // We'll use this stream for the actual recording
        stream.getTracks().forEach(track => track.stop());
        setMicPermission('granted');
      } catch (error) {
        console.log('Microphone permission not granted:', error);
        setMicPermission('denied');
      }
    };

    checkMicrophonePermission();
    initWebSocket();

    // Cleanup function
    return () => {
      stopRecording();
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [initWebSocket]);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      setShowPermissionError(false);
      // Stop the stream immediately as we only needed it for permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicPermission('denied');
      setShowPermissionError(true);
      setStatus('Microphone access denied. Please enable it in your browser settings.');
      return false;
    }
  };

  // Simplified speak function for responses
  const speak = (text) => {
    console.log('🔊 Speaking response:', text.substring(0, 100) + '...');
    
    if (!synthesisRef.current) {
      console.error('❌ Speech synthesis not available');
      return;
    }
    
    synthesisRef.current.cancel();
    
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'en-US';
      
      utteranceRef.current = utterance;
      
      utterance.onstart = () => {
        console.log('✅ Response speech started');
        setPulseAnimation(true);
      };
      utterance.onend = () => {
        console.log('🛑 Response speech ended');
        setPulseAnimation(false);
      };
      utterance.onerror = (event) => {
        console.error('❌ Response speech error:', event.error);
        setPulseAnimation(false);
      };
      
      synthesisRef.current.speak(utterance);
    }, 150);
  };

  const startRecording = async () => {
    console.log('🎙️ Starting recording...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      
      mediaStreamRef.current = stream;
      
      // Initialize audio processing
      if (window.AudioWorkletNode) {
        await initAudioProcessing(stream);
      } else {
        startMediaRecorder(stream);
      }
      
      setStatus('Listening...');
      setPulseAnimation(true);
      
      // Start welcome video if not already finished
      if (!welcomeFinished && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = false;
        videoRef.current.play().catch(err => {
          console.warn('⚠️ Video autoplay prevented:', err);
        });
      }
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMicPermission('denied');
      setShowPermissionError(true);
      setIsActive(false);
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping recording...');
    
    // Stop audio processing
    if (audioContextRef.current) {
      audioContextRef.current.suspend();
      if (audioProcessorRef.current) {
        audioProcessorRef.current.port.postMessage('stop');
      }
    }
    
    // Stop MediaRecorder if it's being used
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Clear any active media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    setPulseAnimation(false);
  };

  const startSilenceDetection = () => {
    // Reset any existing timer
    clearTimeout(silenceTimerRef.current);
    
    // Set a new timer (e.g., 3 seconds of silence)
    silenceTimerRef.current = setTimeout(() => {
      console.log('🔇 No speech detected, stopping recording...');
      stopRecording();
      setStatus('Processing your command...');
    }, 3000);
  };

  const processAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    try {
      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const { text } = await response.json();
      console.log('🎤 Transcribed text:', text);
      
      if (text) {
        setTranscript(text);
        await processCommand(text.toLowerCase().trim());
      }
      
      // Restart recording after processing the command
      if (isActive) {
        // Small delay before restarting to avoid immediate re-trigger
        setTimeout(() => {
          if (isActive) {
            console.log('🔄 Restarting recording...');
            startRecording();
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setStatus('Error processing your voice command. Please try again.');
      
      // Still try to restart recording even if there was an error
      if (isActive) {
        setTimeout(() => {
          if (isActive) {
            console.log('🔄 Restarting recording after error...');
            startRecording();
          }
        }, 1000);
      }
    }
  };

  const startAssistant = async () => {
    console.log('🚀 Starting voice assistant...');
    
    if (micPermission !== 'granted') {
      console.log('🔒 Requesting microphone permission...');
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) {
        console.error('❌ Microphone permission denied');
        return;
      }
    }

    setIsActive(true);
    setShowPermissionError(false);
    setWelcomeFinished(false);
    
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false;
      videoRef.current.play().catch(err => {
        console.warn('⚠️ Video autoplay prevented:', err);
      });
    }
    
    await startRecording();
  };

  const stopAssistant = () => {
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
    setWelcomeFinished(false);
  };

  const processCommand = async (command) => {
    console.log('🔍 Processing command:', command);
    let foundRoute = null;
    let foundKeyword = '';

    // Check for exit or stop commands
    if (['exit', 'stop', 'goodbye', 'that\'s all', 'thank you'].some(cmd => command.includes(cmd))) {
      const response = 'Goodbye! Have a great day!';
      await speak(response);
      setStatus(response);
      stopAssistant();
      return;
    }

    // Check for greeting
    if (['hello', 'hi', 'hey', 'hi there'].some(greeting => command.includes(greeting))) {
      const responses = [
        'Hello! How can I help you today?',
        'Hi there! What would you like to do?',
        'Hello! I\'m here to help. What would you like to do?'
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      await speak(response);
      setStatus('Listening for your command...');
      return;
    }

    // Check for help
    if (command.includes('help') || command.includes('what can you do')) {
      const response = 'I can help you navigate the app. Try saying: "Play games", "Create a song", or "Go to my music"';
      await speak(response);
      setStatus(response);
      return;
    }

    // Check navigation commands
    for (const [route, keywords] of Object.entries(navigationMap)) {
      if (keywords.some(keyword => command.includes(keyword))) {
        foundRoute = route;
        foundKeyword = keywords.find(keyword => command.includes(keyword));
        break;
      }
    }

    if (foundRoute) {
      console.log('✅ Found route:', foundRoute, 'via keyword:', foundKeyword);
      const response = `Taking you to ${foundRoute.replace('-', ' ')}.`;
      await speak(response);
      setStatus(response);
      
      // Small delay before navigation to allow the speech to be heard
      setTimeout(() => {
        router.push(`/${foundRoute}`);
      }, 1000);
    } else {
      console.log('❓ Command not recognized');
      const response = "I didn't quite catch that. Try saying: Play games, Create song, or Go home.";
      await speak(response);
      setStatus('Listening for your command...');
    }
  };

  const toggleListening = () => {
    if (isActive) {
      stopAssistant();
    } else {
      startAssistant();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#141432] to-[#0a0e27] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Starfield Background */}
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
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center"
            style={{
              fontFamily: 'cursive',
              color: '#00d4ff',
              textShadow: '0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)',
              letterSpacing: '2px'
            }}>
          Planet Q Productions
        </h1>

        {/* Subtitle */}
        <h2 className="text-2xl md:text-3xl mb-8 text-center"
            style={{
              fontFamily: 'cursive',
              color: '#ff00ff',
              textShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
              letterSpacing: '1px'
            }}>
          Q_World Studios
        </h2>

        {/* Microphone Permission Error */}
        {showPermissionError && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3 max-w-md">
            <AlertCircle className="text-red-400 flex-shrink-0" size={24} />
            <div className="text-sm text-red-200">
              <p className="font-semibold mb-1">Microphone Access Required</p>
              <p>Please enable microphone permissions in your browser settings to use voice commands.</p>
            </div>
          </div>
        )}

        {/* AI Avatar with Video */}
        <div className="relative mb-8">
          {/* Outer glow ring */}
          <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
            pulseAnimation ? 'animate-ping' : ''
          }`}
               style={{
                 background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)',
                 transform: 'scale(1.2)'
               }} />
          
          {/* Main avatar container */}
          <div 
            className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-purple-500/30"
            style={{
              background: 'radial-gradient(circle at center, rgba(30,30,60,0.9), rgba(10,10,30,0.95))',
              boxShadow: isActive 
                ? '0 0 60px rgba(0,212,255,0.6), inset 0 0 40px rgba(0,100,150,0.3)' 
                : '0 0 30px rgba(0,212,255,0.3), inset 0 0 20px rgba(0,100,150,0.2)'
            }}>
            
            {/* Video Player - Plays welcome audio */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              loop={false}
              playsInline
              onEnded={() => {
                console.log('✅ Welcome video finished.');
                setWelcomeFinished(true);
                setStatus('Ready! Listening for your command...');
              }}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Active listening indicator */}
            {isListening && (
              <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
            )}
          </div>

          {/* Voice indicator icon */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-cyan-500 shadow-lg shadow-cyan-500/50'
            }`}>
              <Volume2 className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Music Creation Label */}
        <h3 className="text-2xl md:text-3xl mb-6 text-center"
            style={{
              fontFamily: 'cursive',
              color: '#ff00ff',
              textShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
              letterSpacing: '1px'
            }}>
          Music Creation
        </h3>

        {/* AI Radio Station Label */}
        <h4 className="text-3xl md:text-4xl mb-8 text-center"
            style={{
              fontFamily: 'cursive',
              color: '#00d4ff',
              textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
              letterSpacing: '2px'
            }}>
          AI Radio Station
        </h4>

        {/* Control Button */}
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
              <Mic size={16} />
              <span className="text-xs">Activate</span>
            </div>
          )}
        </button>

        {/* Status Display */}
        <div className="w-full max-w-md p-6 rounded-lg bg-black/30 backdrop-blur-sm border border-cyan-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              isListening ? 'bg-red-500 animate-pulse' : 
              pulseAnimation ? 'bg-cyan-500 animate-pulse' : 
              'bg-gray-500'
            }`} />
            <p className="text-cyan-300 font-semibold">
              {isListening ? 'Listening...' :
               pulseAnimation ? 'Speaking...' : 
               'Standby'}
            </p>
          </div>
          
          <p className="text-gray-300 text-sm mb-3">{status}</p>
          
          {transcript && (
            <div className="mt-3 pt-3 border-t border-cyan-500/30">
              <p className="text-xs text-gray-400 mb-1">Live Transcription:</p>
              <p className="text-cyan-200 min-h-[20px]">{transcript || '...'}</p>
            </div>
          )}

          {/* Debug Console Hint */}
          <div className="mt-3 pt-3 border-t border-cyan-500/30">
            <p className="text-xs text-gray-400 text-center">
              💡 Open browser console (F12) to see detailed logs
            </p>
          </div>
        </div>

        {/* Navigation Help - Only show when not active */}
        {!isActive && (
          <div className="mt-6 text-center text-gray-400 text-sm max-w-md">
            <p className="mb-2">Once activated, you can say:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-cyan-500/20 rounded-full text-cyan-300">"Play games"</span>
              <span className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-300">"Create song"</span>
              <span className="px-3 py-1 bg-pink-500/20 rounded-full text-pink-300">"Go home"</span>
              <span className="px-3 py-1 bg-green-500/20 rounded-full text-green-300">"About"</span>
              <span className="px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-300">"Contact"</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceNavigationAssistant;