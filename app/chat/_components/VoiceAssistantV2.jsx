"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { getToken } from "../../../lib/openai/token";
import { SYSTEM_INSTRUCTIONS } from "../../../utils/voiceAssistant/prompts";
import { VOICE_ASSISTANT_CONSTANTS, EVENT_TYPES } from "../../../utils/voiceAssistant/constants";
import { MessageParser } from "../../../utils/voiceAssistant/messageParser";
import { MusicGenerationAPI } from "../../../utils/voiceAssistant/apiHelpers";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { FaMicrophone, FaMicrophoneSlash, FaMusic, FaArrowRight } from "react-icons/fa";
import { IoMdClose, Send } from "react-icons/io";
import Image from "next/image";
import { SongGenerationStatus } from './SongGenerationStatus';
import { NavigationButton } from './NavigationButton';

const VoiceAssistantV2 = ({ 
    autoStart = false,
    compact = false
}) => {
    const router = useRouter();
    const aiVideoRef = useRef(null)
    const [connected, setConnected] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcription, setTranscription] = useState('');
    const audioElementRef = useRef(null);
    const peerRef = useRef(null);
    const dataChannelRef = useRef(null);
    const notificationSoundRef = useRef(null);
    const recognitionRef = useRef(null);

    // Initialize notification sound
    useEffect(() => {
        notificationSoundRef.current = new Audio('/sound/notification.mp3');
        return () => {
            if (notificationSoundRef.current) {
                notificationSoundRef.current.pause();
                notificationSoundRef.current = null;
            }
        };
    }, []);

    // Auto-connect when component mounts if autoStart is true
    useEffect(() => {
        if (autoStart) {
            startVoiceAssistant();
        }
        
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            stopVoiceAssistant();
        };
    }, [autoStart]);

    // Handle speech recognition for input transcription
    useEffect(() => {
        if (typeof window !== 'undefined' && window.webkitSpeechRecognition) {
            recognitionRef.current = new window.webkitSpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');

                // Update internal transcription state and parent component
                setTranscription(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                toast.error('Speech recognition error: ' + event.error);
                setConnected(false);
            };
        }
    }, []);

    const [assistantResponse, setAssistantResponse] = useState('');
    const [messages, setMessages] = useState([]);
    const [modals, setModals] = useState({
        navigation: { isOpen: false, data: null },
        songGeneration: { isOpen: false, data: null }
    });

    // Handle JSON commands from messages
    const handleJsonCommand = (jsonData) => {
        if (jsonData.navigateTo) {
            setModals(prev => ({
                ...prev,
                navigation: {
                    isOpen: true,
                    data: {
                        page: jsonData.navigateTo,
                        url: jsonData.url,
                        message: jsonData.message || 'Would you like to navigate?'
                    }
                }
            }));
            return true;
        }
        
        if (jsonData.createSong) {
            setModals(prev => ({
                ...prev,
                songGeneration: {
                    isOpen: true,
                    data: jsonData
                }
            }));
            return true;
        }
        
        return false;
    };
    
    // Close modal
    const closeModal = (modalName) => {
        setModals(prev => ({
            ...prev,
            [modalName]: { isOpen: false, data: null }
        }));
    };

    useEffect(() => {
        const songData = modals.songGeneration.data;
        if (songData?.taskId) {
            // Show toast notification with song generation status
            const toastId = 'song-generation-status';
            
            toast.custom((t) => (
                <div className="w-full max-w-md p-0 bg-transparent shadow-none">
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-white font-medium">
                                    🎵 Generating: {songData.title || 'Your Song'}
                                </h3>
                                <button
                                    onClick={() => {
                                        toast.dismiss(t.id);
                                        closeModal('songGeneration');
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <IoMdClose size={20} />
                                </button>
                            </div>
                            <SongGenerationStatus 
                                generationData={songData}
                                onClose={() => {
                                    toast.dismiss(t.id);
                                    closeModal('songGeneration');
                                }}
                            />
                        </div>
                    </div>
                </div>
            ), {
                duration: Infinity,
                position: 'bottom-right',
                id: toastId,
            });
            
            // Cleanup function to dismiss the toast when component unmounts
            return () => {
                toast.dismiss(toastId);
            };
        }
    }, [modals.songGeneration.data]);

    // Handle message from the assistant
    // const handleAssistantMessage = useCallback((message) => {
    //     setAssistantResponse(prev => {
    //         const newContent = prev + message;
    //         // The message will be rendered with renderMessageContent when displayed
    //         return newContent;
    //     });
    // }, []);

    // Handle assistant messages and check for commands
    const handleAssistantMessage = useCallback((message) => {
        setAssistantResponse(prev => {
            const newContent = prev + message;
            
            // Check for JSON commands in the new content
            const jsonMatch = newContent.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                try {
                    const jsonData = JSON.parse(jsonMatch[1]);
                    if (handleJsonCommand(jsonData)) {
                        // If a command was handled, return the content without the JSON
                        return newContent.replace(/```json[\s\S]*?```/g, '').trim();
                    }
                } catch (e) {
                    console.error('Error parsing JSON command:', e);
                }
            }
            
            return newContent;
        });
    }, []);

    // Handle music generation
    const handleMusicGeneration = useCallback(async (musicData) => {
        if (!musicData) return;

        setIsProcessing(true);
        try {
            const result = await MusicGenerationAPI.generateMusic(musicData);
            
            // Play notification sound
            if (notificationSoundRef.current) {
                notificationSoundRef.current.play().catch(e => console.error('Error playing notification:', e));
            }
            
            // The actual handling of the result is done by renderMessageContent
            return result;
        } catch (error) {
            console.error('Error generating music:', error);
            toast.error(
                (t) => (
                    <div className="flex items-center justify-between">
                        <span>Failed to generate music. Please try again.</span>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="ml-4 text-gray-400 hover:text-white"
                        >
                            <IoMdClose />
                        </button>
                    </div>
                ),
                {
                    duration: 10000,
                    position: 'bottom-right',
                }
            );
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [router]);

    // Handle incoming WebRTC data channel messages
    const handleDataChannelMessage = useCallback((event) => {
        try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            console.log('Received WebRTC message:', data);

            // Handle connection state changes
            if (data.type === 'session.update' && data.status === 'connected') {
                setConnected(true);
            } else if (data.type === 'session.update' && data.status === 'disconnected') {
                setConnected(false);
                toast.success('Voice assistant disconnected', {
                    duration: 3000,
                    position: 'top-center'
                })
            }

            switch (data.type) {
                case 'response.text.delta':
                    setMessages(prev => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage?.from === 'assistant') {
                            return [
                                ...prev.slice(0, -1),
                                { from: 'assistant', text: lastMessage.text + (data.delta || '') }
                            ];
                        }
                        return [...prev, { from: 'assistant', text: data.delta || '' }];
                    });
                    break;

                case 'response.text.done':
                    const finalText = data.response?.output?.[0]?.text || '';
                    setMessages(prev => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage?.from === 'assistant') {
                            return [
                                ...prev.slice(0, -1),
                                { from: 'assistant', text: finalText }
                            ];
                        }
                        return [...prev, { from: 'assistant', text: finalText }];
                    });
                    break;

                case 'response.done':
                    // Handle final response
                    const fullText = data.response?.output?.[0]?.content?.[0]?.transcript || '';
                    if (fullText) {
                        setMessages(prev => {
                            const lastMessage = prev[prev.length - 1];
                            if (lastMessage?.from === 'assistant') {
                                return [
                                    ...prev.slice(0, -1),
                                    { from: 'assistant', text: fullText, status: 'completed' }
                                ];
                            }
                            return [...prev, { from: 'assistant', text: fullText, status: 'completed' }];
                        });
                    }

                    // Check for music generation command
                    try {
                        const parsedResponse = MessageParser.parseResponse(fullText);
                        if (parsedResponse?.commands?.generateMusic) {
                            handleMusicGeneration(parsedResponse.musicData);
                        }
                    } catch (error) {
                        console.error('Error parsing response for commands:', error);
                    }
                    break;

                default:
                    console.log('Unhandled WebRTC message type:', data.type);
            }
        } catch (error) {
            console.error('Error processing WebRTC message:', error);
        }
    }, [handleMusicGeneration]);

    const startVoiceAssistant = async () => {
        try {
            // Start speech recognition if available
            if (recognitionRef.current) {
                recognitionRef.current.start();
            }

            // 1. Retrieve the ephemeral token for authenticating the session with OpenAI.
            const EPHEMERAL_KEY = await getToken();
            console.log('🔑 Successfully retrieved ephemeral token');

            // 2. Create a new RTCPeerConnection instance to manage the WebRTC connection.
            const peer = new RTCPeerConnection();
            peerRef.current = peer;

            // 3. Create an audio element that will play the incoming audio stream from the assistant.
            const audioElement = document.createElement("audio");
            audioElement.autoplay = true;
            audioElementRef.current = audioElement;

            peer.ontrack = (e) => {
                audioElement.srcObject = e.streams[0];
            };

            // 4. Capture the audio stream from the user's microphone.
            const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

            // 5. Create a data channel for exchanging messages with the assistant.
            const dataChannel = peer.createDataChannel("oai-events");
            dataChannelRef.current = dataChannel;

            // Set up data channel event handlers
            dataChannel.onopen = () => {
                setConnected(true);
                console.log("🔔 DataChannel is open!");

                // Send initial session configuration
                dataChannel.send(JSON.stringify({
                    type: "session.update",
                    session: {
                        instructions: SYSTEM_INSTRUCTIONS
                    }
                }));
            };

            dataChannel.onmessage = handleDataChannelMessage;
            dataChannel.onerror = (error) => {
                console.error('Data channel error:', error);
                toast.error('Data channel error: ' + error.message);
            };

            // 6. Create and set local description (offer)
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            // 7. Send the SDP offer to OpenAI's realtime API
            console.log('📡 Sending WebRTC offer to OpenAI...');
            const sdpResponse = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${EPHEMERAL_KEY}`,
                    'Content-Type': 'application/sdp',
                },
                body: offer.sdp
            });

            if (!sdpResponse.ok) {
                const error = await sdpResponse.json().catch(() => ({}));
                throw new Error(`OpenAI API error (${sdpResponse.status}): ${error.error?.message || sdpResponse.statusText}`);
            }

            // 8. Set remote description with the answer from OpenAI
            const answerSDP = await sdpResponse.text();
            await peer.setRemoteDescription({
                type: 'answer',
                sdp: answerSDP
            });

            console.log('✅ WebRTC connection established');
            toast.success('Connected to voice assistant');

            // 9. Set up data channel handlers
            dataChannel.onopen = () => {
                setConnected(true);
                console.log("🔔 DataChannel is open!");

                // Send system instructions
                const systemMessage = {
                    type: "session.update",
                    session: {
                        instructions: SYSTEM_INSTRUCTIONS
                    },
                };

                console.log('Sending system instructions...');
                dataChannel.send(JSON.stringify(systemMessage));

                // Show connected toast
                toast(
                    (t) => (
                        <div className="flex items-center justify-between">
                            <span>Voice assistant connected</span>
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                className="ml-4 text-gray-400 hover:text-white"
                            >
                                <IoMdClose />
                            </button>
                        </div>
                    ),
                    {
                        duration: 5000,
                        position: 'bottom-right',
                    }
                );
            };

            dataChannel.onclose = () => {
                console.log('DataChannel closed');
                setConnected(false);
                toast.success('Voice assistant disconnected', {
                    duration: 3000,
                    position: 'bottom-right'
                });
            };

            dataChannel.onerror = (error) => {
                console.error('DataChannel error:', error);
                setConnected(false);
                toast.error('Connection error: ' + (error.message || 'Unknown error'), {
                    duration: 5000,
                    position: 'bottom-right'
                });
            };
        } catch (error) {
            console.error('Error in startVoiceAssistant:', error);
            toast.error(`Connection error: ${error.message}`, {
                duration: 5000,
                position: 'bottom-right'
            });
            setConnected(false);
        }
    };

    const stopVoiceAssistant = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        // Stop all media tracks
        if (peerRef.current) {
            peerRef.current.getSenders().forEach(sender => {
                if (sender.track) {
                    sender.track.stop();
                }
            });
            peerRef.current.ontrack = null;
            peerRef.current.onicecandidate = null;
            peerRef.current.oniceconnectionstatechange = null;
            peerRef.current.onsignalingstatechange = null;
            peerRef.current.close();
            peerRef.current = null;
        }

        // Close data channel
        if (dataChannelRef.current) {
            dataChannelRef.current.onmessage = null;
            dataChannelRef.current.onopen = null;
            dataChannelRef.current.onclose = null;
            dataChannelRef.current.onerror = null;
            dataChannelRef.current.close();
            dataChannelRef.current = null;
        }

        // Clean up audio element
        if (audioElementRef.current) {
            audioElementRef.current.pause();
            if (audioElementRef.current.srcObject) {
                audioElementRef.current.srcObject.getTracks().forEach(track => track.stop());
                audioElementRef.current.srcObject = null;
            }
            audioElementRef.current.remove();
            audioElementRef.current = null;
        }

        // Audio context cleanup removed as it's not used in the current implementation

        setConnected(false);
        toast(
            (t) => (
                <div className="flex items-center justify-between">
                    <span>Voice assistant disconnected</span>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="ml-4 text-gray-400 hover:text-white"
                    >
                        <IoMdClose />
                    </button>
                </div>
            ),
            {
                duration: 3000,
                position: 'bottom-right',
            }
        );
    }, []);

    const handleTextSubmit = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        // Add user message
        const userMessage = {
            from: 'user',
            text: inputText,
            status: 'completed',
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');

        // Here you would typically send the message to your API
        // For now, we'll just echo it back
        setTimeout(() => {
            setMessages(prev => [
                ...prev,
                {
                    from: 'assistant',
                    text: `You said: ${inputText}`,
                    status: 'completed',
                    timestamp: new Date().toISOString()
                }
            ]);
        }, 500);
    };

    // Add cleanup on unmount
    useEffect(() => {
        return () => {
            console.log('Cleaning up VoiceAssistantV2...');
            stopVoiceAssistant();
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            // Clear any remaining toasts when component unmounts
            toast.dismiss();
        };
    }, [stopVoiceAssistant]);

    // Render compact UI if in compact mode
    if (compact) {
        return (
            <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4">
                    <div className={`absolute inset-0 rounded-full ${
                        connected 
                            ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                            : 'bg-gradient-to-r from-gray-400 to-gray-600'
                    } p-0.5`}>
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-900">
                            <Image
                                src="/images/chat-bot/bot-icon.png"
                                alt="AI Assistant"
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    {connected && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                    )}
                </div>
                <div className={`text-sm font-medium ${
                    connected ? 'text-green-400' : 'text-gray-400'
                }`}>
                    {connected ? 'Listening...' : 'Connecting...'}
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full">

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full mx-auto p-4 rounded-2xl bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 shadow-2xl">
                {/* Avatar Container */}
                <div className="relative w-64 h-64 mb-8 group">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 p-1 animate-rotate-slow">
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-900">
                            <video 
                                autoPlay 
                                loop 
                                muted 
                                className="w-full h-full object-cover opacity-90"
                                ref={aiVideoRef}
                            >
                                <source src="/images/anicircle.mp4" type="video/mp4" />
                            </video>
                            <Image
                                src="/images/chat-bot/bot-icon.png"
                                alt="AI Assistant"
                                width={256}
                                height={256}
                                className="absolute inset-0 w-full h-full object-cover p-2"
                                priority
                            />
                        </div>
                    </div>
                    
                    {/* Pulsing ring effect when connected */}
                    {connected && (
                        <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-pulse"></div>
                    )}
                </div>

                {/* Status indicator */}
                <div className={`flex items-center mb-6 px-4 py-2 rounded-full text-sm font-medium ${
                    connected ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-400'
                }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                        connected ? 'bg-green-400' : 'bg-gray-400'
                    }`}></span>
                    {connected ? 'Connected' : 'Disconnected'}
                </div>

                {/* Control button */}
                <div className={`transition-all duration-500 transform ${
                    connected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}>
                    <button
                        onClick={stopVoiceAssistant}
                        className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full font-medium shadow-lg hover:shadow-red-500/30 transition-all duration-300 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center">
                            <FaMicrophoneSlash className="mr-2" />
                            Stop Assistant
                        </span>
                        <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </button>
                </div>

                {/* Start button (only shows when disconnected) */}
                {!connected && (
                    <button
                        onClick={startVoiceAssistant}
                        className="mt-6 group relative px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-blue-500/30 transition-all duration-300 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center">
                            <FaMicrophone className="mr-2" />
                            Start Voice Assistant
                        </span>
                        <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </button>
                )}
            </div>

            {/* Navigation Modal */}
            {modals.navigation.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-white">Navigation</h3>
                            <button 
                                onClick={() => closeModal('navigation')}
                                className="text-gray-400 hover:text-white"
                            >
                                <IoMdClose size={24} />
                            </button>
                        </div>
                        <p className="text-gray-300 mb-6">{modals.navigation.data?.message}</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => closeModal('navigation')}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <NavigationButton 
                                page={modals.navigation.data?.page || 'Page'}
                                url={modals.navigation.data?.url}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Song Generation Modal */}
            {modals.songGeneration.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-white">
                                🎵 Generating: {modals.songGeneration.data?.title || 'Your Song'}
                            </h3>
                            <button 
                                onClick={() => closeModal('songGeneration')}
                                className="text-gray-400 hover:text-white"
                            >
                                <IoMdClose size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <SongGenerationStatus 
                                generationData={modals.songGeneration.data}
                                onClose={() => closeModal('songGeneration')}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Add global styles for animations */}
            <style jsx global>{`
                @keyframes rotate-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-rotate-slow {
                    animation: rotate-slow 20s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default VoiceAssistantV2;
