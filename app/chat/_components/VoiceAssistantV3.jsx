"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useWebRTCSession } from "@/hooks/useWebRTCSession";
import { SYSTEM_INSTRUCTIONS } from "@/utils/voiceAssistant/prompts";
import { MusicGenerationAPI } from "@/utils/voiceAssistant/apiHelpers";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { FaMicrophone, FaMicrophoneSlash, FaMusic, FaArrowRight } from "react-icons/fa";
import { IoMdClose, Send } from "react-icons/io";
import Image from "next/image";
import { SongGenerationStatus } from './SongGenerationStatus';
import { NavigationButton } from './NavigationButton';

// Custom hook to check if we're on the client side
const useClientOnly = () => {
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    return isClient;
};

const VoiceAssistantV3 = ({ 
    autoStart = false,
    compact = false
}) => {
    const router = useRouter();
    const isClient = useClientOnly();
    
    // State for UI
    const [inputText, setInputText] = useState('');
    const [modals, setModals] = useState({
        navigation: { isOpen: false, data: null },
        songGeneration: { isOpen: false, data: null }
    });
    const notificationSoundRef = useRef(null);
    
    // Use the useWebRTCSession hook
    const {
        status,
        error,
        messages,
        isProcessing,
        startSession,
        stopSession,
        sendMessage,
        activeToolUI
    } = useWebRTCSession();

    const [showToolUI, setShowToolUI] = useState(false);
    console.log("activeToolUI", activeToolUI);
    
    const connected = status === 'connected';
    const connecting = status === 'connecting';
    
    // Initialize notification sound (client-side only)
    useEffect(() => {
        if (!isClient) return;
        
        try {
            notificationSoundRef.current = new Audio('/sound/notification.mp3');
        } catch (error) {
            console.warn('Could not initialize notification sound:', error);
        }
        
        return () => {
            if (notificationSoundRef.current) {
                notificationSoundRef.current.pause();
                notificationSoundRef.current = null;
            }
        };
    }, [isClient]);

    // Handle JSON commands from messages
    const handleJsonCommand = useCallback((jsonData) => {
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
    }, []);
    
    // Close modal
    const closeModal = useCallback((modalName) => {
        setModals(prev => ({
            ...prev,
            [modalName]: { isOpen: false, data: null }
        }));
    }, []);

    // Handle music generation
    const handleMusicGeneration = useCallback(async (musicData) => {
        if (!musicData) return;

        try {
            const result = await MusicGenerationAPI.generateMusic(musicData);
            
            // Play notification sound
            if (notificationSoundRef.current) {
                notificationSoundRef.current.play().catch(e => console.error('Error playing notification:', e));
            }
            
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
        }
    }, []);

    // Handle assistant messages and check for commands
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.from === 'assistant') {
            // Check for JSON commands in the message
            const jsonMatch = lastMessage.text.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                try {
                    const jsonData = JSON.parse(jsonMatch[1]);
                    handleJsonCommand(jsonData);
                } catch (e) {
                    console.error('Error parsing JSON command:', e);
                }
            }
        }
    }, [messages, handleJsonCommand]);

    // Auto-start the session if needed
    useEffect(() => {
        if (autoStart && isClient) {
            startSession({
                instructions: SYSTEM_INSTRUCTIONS,
                onMessage: (message) => {
                    // Handle incoming messages if needed
                    console.log('New message from assistant:', message);
                },
                onError: (error) => {
                    console.error('WebRTC error:', error);
                    toast.error(`Connection error: ${error.message}`);
                },
                onStatusChange: (newStatus) => {
                    console.log('Status changed to:', newStatus);
                    if (newStatus === 'connected') {
                        toast.success('Voice assistant connected');
                    } else if (newStatus === 'disconnected') {
                        toast('Voice assistant disconnected', { duration: 3000 });
                    }
                }
            });
        }
        
        return () => {
            if (autoStart) {
                stopSession();
            }
        };
    }, [autoStart, isClient, startSession, stopSession]);

    // Song generation status effect
    useEffect(() => {
        const songData = modals.songGeneration.data;
        if (songData?.taskId) {
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
            
            return () => {
                toast.dismiss(toastId);
            };
        }
    }, [modals.songGeneration.data, closeModal]);

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

        // Send the message through WebRTC
        sendMessage(inputText);
        setInputText('');
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopSession();
            toast.dismiss();
        };
    }, [stopSession]);

    useEffect(() => {
        if (activeToolUI) {
            setShowToolUI(true);
        } else {
            setShowToolUI(false);
        }
    }, [activeToolUI]);

    if (showToolUI) {
        return (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
                <div className="relative w-full max-w-md">
                    <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-white">{activeToolUI.type}</h3>
                                <button
                                    onClick={() => setShowToolUI(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <IoMdClose size={20} />
                                </button>
                            </div>
                            {activeToolUI.data}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading state on server-side render or when client features aren't available
    if (!isClient) {
        return (
            <div className="relative w-full">
                <div className="relative z-10 flex flex-col items-center justify-center w-full mx-auto p-4 rounded-2xl bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 shadow-2xl">
                    <div className="relative w-64 h-64 mb-8">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 p-1">
                            <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-900">
                                <div className="w-full h-full bg-gray-800 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                    <div className="text-gray-400 text-sm font-medium">
                        Loading voice assistant...
                    </div>
                </div>
            </div>
        );
    }

    // Render compact UI if in compact mode
    if (compact) {
        return (
            <div className="flex flex-col items-center" suppressHydrationWarning>
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
                    {connected ? 'Listening...' : connecting ? 'Connecting...' : 'Tap to start'}
                </div>
                
                {!connected && !connecting && (
                    <button
                        onClick={startSession}
                        className="mt-2 px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                    >
                        Start
                    </button>
                )}
                
                {connected && (
                    <button
                        onClick={stopSession}
                        className="mt-2 px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                    >
                        Stop
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="relative w-full" suppressHydrationWarning>
            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full mx-auto p-4 rounded-2xl bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 shadow-2xl">
                {/* Avatar Container */}
                <div className="relative w-64 h-64 mb-8 group">
                    <div className={`absolute inset-0 rounded-full p-1 ${
                        connected 
                            ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-rotate-slow' 
                            : 'bg-gradient-to-r from-gray-400 to-gray-600'
                    }`}>
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-900">
                            <video 
                                autoPlay 
                                loop 
                                muted 
                                className="w-full h-full object-cover opacity-90"
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
                    connected 
                        ? 'bg-green-500/20 text-green-400' 
                        : connecting 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-gray-700/50 text-gray-400'
                }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                        connected 
                            ? 'bg-green-400' 
                            : connecting 
                                ? 'bg-yellow-400' 
                                : 'bg-gray-400'
                    }`}></span>
                    {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
                </div>

                {/* Control buttons */}
                <div className="flex gap-4">
                    {!connected && !connecting && (
                        <button
                            onClick={startSession}
                            className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium shadow-lg hover:shadow-blue-500/30 transition-all duration-300 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center">
                                <FaMicrophone className="mr-2" />
                                Start Assistant
                            </span>
                            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        </button>
                    )}

                    {(connected || connecting) && (
                        <button
                            onClick={stopSession}
                            className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full font-medium shadow-lg hover:shadow-red-500/30 transition-all duration-300 overflow-hidden"
                            disabled={connecting}
                        >
                            <span className="relative z-10 flex items-center">
                                <FaMicrophoneSlash className="mr-2" />
                                {connecting ? 'Connecting...' : 'Stop Assistant'}
                            </span>
                            <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        </button>
                    )}
                </div>

                {/* Text input for non-voice interaction */}
                <div className="mt-6 w-full max-w-md">
                    <form onSubmit={handleTextSubmit} className="relative">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full px-4 py-3 pr-12 bg-gray-700/50 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={!connected}
                        />
                        <button 
                            type="submit"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-50"
                            disabled={!inputText.trim() || !connected}
                        >
                            <FaArrowRight />
                        </button>
                    </form>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm text-center max-w-md">
                        {error.message || 'An error occurred. Please try again.'}
                    </div>
                )}

                {/* Browser compatibility notice */}
                {!window.RTCPeerConnection && (
                    <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm text-center max-w-md">
                        <p>Voice assistant requires WebRTC support.</p>
                        <p className="mt-1 text-xs text-yellow-500">
                            Please use a modern browser like Chrome, Firefox, or Safari.
                        </p>
                    </div>
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

export default VoiceAssistantV3;
