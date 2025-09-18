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
    compact = true
}) => {
    const router = useRouter();
    const isClient = useClientOnly();

    const [modals, setModals] = useState({
        navigation: { isOpen: false, data: null },
        songGeneration: { isOpen: false, data: null }
    });
    const notificationSoundRef = useRef(null);

    // Use the useWebRTCSession hook
    const {
        status,
        error,
        startSession,
        stopSession,
        messages,
        generationStatus,
        isProcessing,
        showNavigationPopup,
        showSongPopup,
        activeToolUI,
    } = useWebRTCSession();

    console.log("generationStatus", generationStatus);

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

    // Close modal
    const closeModal = useCallback((modalName) => {
        setModals(prev => ({
            ...prev,
            [modalName]: { isOpen: false, data: null }
        }));
    }, []);

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

    // if (showToolUI) {
    //     return (
    //         <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
    //             <div className="relative w-full max-w-md">
    //                 <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-xl">
    //                     <div className="p-4">
    //                         <div className="flex justify-between items-center mb-4">
    //                             {/* <h3 className="text-lg font-medium text-white">{activeToolUI}</h3> */}
    //                             <button
    //                                 onClick={() => setShowToolUI(false)}
    //                                 className="text-gray-400 hover:text-white"
    //                             >
    //                                 <IoMdClose size={20} />
    //                             </button>
    //                         </div>
    //                         {/* {activeToolUI.data} */}
    //                         <pre>{JSON.stringify(activeToolUI, null, 2)}</pre>
    //                     </div>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    // Show loading state on server-side render or when client features aren't available
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
            <div className="flex flex-col items-center justify-center bg-gray-600 h-screen" suppressHydrationWarning>
                <div className="relative w-80 h-80 mb-4">
                    <div className={`absolute inset-0 rounded-full ${connected
                        ? 'bg-gradient-to-r from-green-400 to-blue-500'
                        : 'bg-gradient-to-r from-gray-400 to-gray-600'
                        } p-0.5`}>
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-900">
                            {/* <Image
                                src="/images/chat-bot/bot-icon.png"
                                alt="AI Assistant"
                                width={200}
                                height={200}
                                className="w-full h-full object-cover"
                            /> */}
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            >
                                <source src="/videos/generator.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                    {connected && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                    )}
                </div>
                <div className={`text-sm font-medium mb-4 ${connected ? 'text-green-400' : 'text-gray-400'
                    }`}>
                    {connected ? 'Listening...' : connecting ? 'Connecting...' : 'Tap to start'}
                </div>

                {!connected && !connecting && (
                    <button
                        onClick={startSession}
                        className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full font-medium shadow-lg hover:shadow-red-500/30 transition-all duration-300 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center">
                            <FaMicrophone className="mr-2" />
                            Start Assistant
                        </span>
                        <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </button>
                )}

                {connected && (
                    <button
                        onClick={stopSession}
                        className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full font-medium shadow-lg hover:shadow-red-500/30 transition-all duration-300 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center">
                            <FaMicrophoneSlash className="mr-2" />
                            Stop Assistant
                        </span>
                        <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="relative w-full" suppressHydrationWarning>
          
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
                                🎵 Generating
                            </h3>
                            <button
                                onClick={() => closeModal('songGeneration')}
                                className="text-gray-400 hover:text-white"
                            >
                                <IoMdClose size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {showNavigationPopup.open && (
                                <div className="p-2 bg-gray-200 rounded">
                                    <p>Navigate to: {showNavigationPopup.url}</p>
                                </div>
                            )}

                            {showSongPopup.open && (
                                <div className="p-2 bg-gray-200 rounded">
                                    <p>Generate Song: Title</p>
                                    <p>Prompt: Prompt</p>
                                </div>
                            )}

                            {activeToolUI && (
                                <div className="p-2 bg-gray-100 rounded shadow">
                                    <p>Tool: {activeToolUI.type}</p>
                                    <div className="flex gap-2 mt-2">
                                        <Button onClick={activeToolUI.onConfirm} disabled={activeToolUI.isLoading}>
                                            Confirm
                                        </Button>
                                        <Button variant="secondary" onClick={activeToolUI.onCancel}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
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
