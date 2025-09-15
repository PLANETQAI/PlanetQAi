'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { useChat } from 'ai/react'
import Link from 'next/link'
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa'
import { IoMdSend } from 'react-icons/io'
import { NavigationButton } from './NavigationButton'
import VoiceAssistantV3 from './VoiceAssistantV3'
import { MusicGenerationAPI } from '@/utils/voiceAssistant/apiHelpers'

// Memoize the message item to prevent re-renders
const MessageItem = React.memo(({ message, onCreateSong, isGenerating, generationStatus, currentSongData }) => {

    console.log("MessageItem", message)
    console.log("IsGenerating", isGenerating)
    console.log("GenerationStatus", generationStatus)
    console.log("CurrentSongData", currentSongData)
    console.log("OnCreateSong", onCreateSong)

    const renderMessageContent = (content) => {
        // Check for JSON in the message
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        
        // If no JSON match, return the content as is
        if (!jsonMatch) {
            console.log('No JSON found in message');
            return <span>{content}</span>;
        }
        
        // Get the text before the JSON block
        const beforeJson = content.split('```json')[0].trim();
        
        // Parse the JSON data
        let jsonData;
        try {
            jsonData = JSON.parse(jsonMatch[1]);
            console.log('JSON Data:', jsonData);
        } catch (e) {
            console.error('Error parsing JSON:', e);
            return <span>{content}</span>;
        }

        try {

            // Handle navigation
            if (jsonData.navigateTo) {
                return (
                    <div className="space-y-2">
                        <p>{content.replace(/```json[\s\S]*?```/g, '').trim() || 'Would you like to navigate?'}</p>
                        <NavigationButton
                            page={jsonData.navigateTo}
                            url={jsonData.url}
                            className="mt-2"
                        />
                    </div>
                );
            }

            // Handle song generation
            if (jsonData.createSong) {
                console.log('Song generation data found:', jsonData);
                const isCompleted = generationStatus === 'completed' && currentSongData?.id === jsonData.songId;
                console.log('Is generation completed?', isCompleted, 'Current status:', generationStatus, 'Current song data:', currentSongData);
                
                // Auto-start generation if not already generating and not completed
                useEffect(() => {
                    if (!isGenerating && jsonData.autoGenerate !== false && !isCompleted) {
                        onCreateSong(jsonData);
                    }
                }, [jsonData.songId, isGenerating, isCompleted, onCreateSong]);

                return (
                    <div className="space-y-3 bg-gray-800 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-medium text-white">
                                🎵 {jsonData.title || 'New Song'}
                                {isGenerating && (
                                    <span className="ml-2 text-sm text-gray-400">(Generating...)</span>
                                )}
                                {isCompleted && (
                                    <span className="ml-2 text-sm text-green-400">(Completed)</span>
                                )}
                            </h3>
                            {isGenerating ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-gray-300">Creating...</span>
                                </div>
                            ) : isCompleted && currentSongData?.audio_url ? (
                                <a 
                                    href={currentSongData.audio_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Play Song
                                </a>
                            ) : null}
                        </div>
                        
                        {jsonData.prompt && (
                            <div className="bg-gray-700 p-3 rounded-lg">
                                <p className="text-gray-200 text-sm">{jsonData.prompt}</p>
                            </div>
                        )}
                        
                    </div>
                );
            }

            return <span>{content}</span>;
        } catch (e) {
            console.error('Error parsing message content:', e);
            return <span>{content}</span>;
        }
    };

    return (
        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                {message.role === 'assistant' && (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image
                            src="/images/chat-bot/bot-icon.png"
                            alt="AI Face"
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
                <div className={`my-2 p-4 max-w-3xl ${message.role === 'user' ? 'bg-gray-600 rounded-xl' : 'bg-gray-700 rounded-xl'}`}>
                    {message.role === 'user' ? (
                        <span>{message.content}</span>
                    ) : message.toolInvocations ? (
                        <pre className="whitespace-pre-wrap">{JSON.stringify(message.toolInvocations, null, 2)}</pre>
                    ) : (
                        renderMessageContent(message.content)
                    )}
                </div>
            </div>
        </div>
    );
});

MessageItem.displayName = 'MessageItem';

export default function ChatBot() {
    const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    // Song generation states
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentSongData, setCurrentSongData] = useState(null);
    const [generationStartTime, setGenerationStartTime] = useState(null);
    const [generationStatus, setGenerationStatus] = useState('idle'); // idle, generating, completed, error
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationTime, setGenerationTime] = useState(0);
    const [generationError, setGenerationError] = useState('');
    
    // Refs for polling and tracking generated songs
    const pollingInterval = useRef(null);
    const startTime = useRef(null);
    const generationTimer = useRef(null);
    const generatedSongIds = useRef(new Set());

    const { messages, input, handleSubmit, handleInputChange, isLoading, append, setMessages } = useChat({
        onResponse: (response) => {
            if (response.status === 402) {
                // Handle insufficient credits
                setShowPaymentPrompt(true);
                setErrorMessage('Insufficient credits. Please purchase more to continue chatting.');
                // Remove the loading message
                setMessages(messages.slice(0, -1));
                return;
            }
            setShowPaymentPrompt(false);
            setErrorMessage('');
        },
        onError: (error) => {
            console.error('Chat error:', error);
            setErrorMessage('An error occurred while processing your message.');
        },
        onFinish: (message) => {
            // Check for JSON in the response
            const jsonMatch = message.content.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                try {
                    const jsonData = JSON.parse(jsonMatch[1]);
                    if (jsonData.navigateTo || jsonData.createSong) {
                        // We'll handle this in the message rendering
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing JSON response:', e);
                }
            }
        },
    });

    // Song generation functions
    const handleCreateSong = useCallback(async (songData) => {
        console.log('handleCreateSong called with:', songData);
        // Skip if already generated or generating
        if (generatedSongIds.current.has(songData.songId) || isGenerating) {
            console.log('Song already generated or generation in progress');
            return;
        }

        let progressInterval = null;
        
        try {
            setIsGenerating(true);
            setGenerationStatus('generating');
            setGenerationStartTime(Date.now());
            setGenerationProgress(0);
            setGenerationError(null);

            // Add to generated set
            generatedSongIds.current.add(songData.songId);

            // Start progress simulation
            progressInterval = setInterval(() => {
                setGenerationProgress(prev => {
                    const newProgress = prev + Math.random() * 5;
                    return newProgress > 90 ? 90 : newProgress;
                });
            }, 1000);

            // Call your music generation API
            const response = await MusicGenerationAPI.generateMusic({
                prompt: songData.prompt,
                title: songData.title,
            }, (status) => {
                // Handle status updates from the API
                if (status.status === 'completed' || (status.output?.songs && status.output.songs.length > 0)) {
                    setGenerationStatus('completed');
                    setGenerationProgress(100);
                    setIsGenerating(false);
                    
                    const song = Array.isArray(status.output?.songs) ? status.output.songs[0] : status.output;
                    
                    // Update the message content to mark as completed
                    setMessages(prevMessages => {
                        return prevMessages.map(msg => {
                            if (msg.content.includes(songData.songId)) {
                                const updatedContent = msg.content.replace(
                                    /(\{\s*"createSong"\s*:).*?(\})/s,
                                    `$1 true, "status": "completed", "songId": "${songData.songId}"$2`
                                );
                                return { ...msg, content: updatedContent };
                            }
                            return msg;
                        });
                    });
                    
                    // Update song data with completed info
                    setCurrentSongData(prev => ({
                        ...prev,
                        ...song,
                        id: songData.songId,
                        audio_url: song.song_path || song.audio_url,
                        image_url: song.image_path,
                        lyrics: song.lyrics
                    }));
                } else if (status.status === 'failed') {
                    setGenerationStatus('error');
                    setGenerationError(status.error || 'Failed to generate song');
                    setIsGenerating(false);
                } else {
                    // Update progress
                    setGenerationStatus(status.status || 'generating');
                    setGenerationProgress(prev => {
                        const newProgress = prev + Math.random() * 10;
                        return newProgress > 90 ? 90 : newProgress;
                    });
                }
            });
        } catch (error) {
            console.error('Error generating song:', error);
            setGenerationStatus('error');
            setGenerationError(error.message);
            // Remove from generated set on error to allow retry
            if (songData?.songId) {
                generatedSongIds.current.delete(songData.songId);
            }
        } finally {
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
            setIsGenerating(false);
        }
    }, [isGenerating]);

    const startPolling = useCallback((taskId, songId) => {
        // Clear any existing polling
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
        }

        // Start polling every 20 seconds
        pollingInterval.current = setInterval(() => {
            checkStatus(taskId, songId);
        }, 20000); // 20 seconds

        // Also check immediately
        checkStatus(taskId, songId);
    }, []);

    const checkStatus = async (taskId, songId) => {
        try {
            const statusResponse = await MusicGenerationAPI.checkGenerationStatus(taskId, songId);
            
            // Handle the response in the callback
            if (statusResponse.status === 'completed' || (statusResponse.output?.songs && statusResponse.output.songs.length > 0)) {
                setGenerationStatus('completed');
                setGenerationProgress(100);
                setIsGenerating(false);
                
                const song = Array.isArray(statusResponse.output?.songs) ? statusResponse.output.songs[0] : statusResponse.output;
                
                // Update the message content to mark as completed
                setMessages(prevMessages => {
                    return prevMessages.map(msg => {
                        if (msg.content.includes(songId)) {
                            const updatedContent = msg.content.replace(
                                /(\{\s*"createSong"\s*:).*?(\})/s,
                                `$1 true, "status": "completed", "songId": "${songId}"$2`
                            );
                            return { ...msg, content: updatedContent };
                        }
                        return msg;
                    });
                });
                
                // Update song data with completed info
                setCurrentSongData(prev => ({
                    ...prev,
                    ...song,
                    id: songId,
                    audio_url: song.song_path || song.audio_url,
                    image_url: song.image_path,
                    lyrics: song.lyrics
                }));

                // Show success message
                alert('Song generation completed successfully!');
            } else if (statusResponse.status === 'failed') {
                throw new Error('Generation failed');
            } else {
                // Still generating, update progress
                setGenerationProgress(prev => Math.min(prev + 5, 90));
            }
        } catch (error) {
            console.error('Error checking status:', error);
            setGenerationStatus('error');
            setGenerationError(error.message || 'Failed to check generation status');
            setIsGenerating(false);
        } finally {
            // Clear polling and timer in all cases
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
                pollingInterval.current = null;
            }
            if (generationTimer.current) {
                clearInterval(generationTimer.current);
                generationTimer.current = null;
            }
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
            if (generationTimer.current) {
                clearInterval(generationTimer.current);
            }
        };
    }, []);

    const handlePaymentNavigation = () => {
        // Navigate to the payment page
        window.location.href = '/pricing';
    };

    const [triggerPrompt, setTriggerPrompt] = useState(false);
    // Load voice assistant state from localStorage on component mount
    const [isVoiceAssistantActive, setIsVoiceAssistantActive] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('isVoiceAssistantActive');
            return saved === 'true';
        }
        return false;
    });

    const aiVideoRef = useRef(null);
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Update localStorage when voice assistant state changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('isVoiceAssistantActive', isVoiceAssistantActive);
        }
    }, [isVoiceAssistantActive]);

    // Handle input change and switch to chat mode when typing
    const handleInputChangeMemoized = useCallback((e) => {
        // If we're in voice mode and user starts typing, switch to chat mode
        if (isVoiceAssistantActive && e.target.value.trim() !== '') {
            setIsVoiceAssistantActive(false);
        }
        handleInputChange(e);
    }, [handleInputChange, isVoiceAssistantActive]);

    // Memoize the submit handler
    const handleSubmitMemoized = useCallback((e) => {
        if (e) e.preventDefault();
        handleSubmit(e);
    }, [handleSubmit]);

    useEffect(() => {
        if (triggerPrompt) {
            handleSubmit()
        }
    }, [triggerPrompt, handleSubmit])

    useEffect(() => {
        if (isLoading) {
            if (aiVideoRef.current) {
                aiVideoRef.current.play()
            }
        } else {
            if (aiVideoRef.current) {
                aiVideoRef.current.pause()
            }
        }
        console.log(aiVideoRef.current)
    }, [isLoading])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-gray-600 min-h-screen">
            <div className="flex justify-between flex-col min-h-screen bg-[#17101D]">
                <div
                    className="flex items-center justify-center px-2 gap-12 sticky top-0"
                    style={{
                        backgroundColor: 'rgb(31 41 55 / var(--tw-bg-opacity))',
                    }}>
                    <div className="relative w-[100px] h-[100px] overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                            <video autoPlay loop muted className="w-[150%] h-auto object-cover rounded-full">
                                <source src="/images/anicircle.mp4" type="video/mp4" />
                            </video>
                            <Image
                                src="/images/radio1.jpeg"
                                alt="Radio Right"
                                width={100}
                                height={100}
                                className="absolute p-1 sm:p-4 rounded-full"
                            />
                        </div>
                    </div>

                    <video
                        ref={aiVideoRef}
                        className={`w-32 h-32 sm:w-48 sm:h-48 hover:shadow-[0_0_15px_rgba(0,300,300,0.8)] hover:cursor-pointer aspect-square rounded-full ${isLoading && 'flicker-shadow'
                            }`}
                        src="/videos/Planet-q-Chatbox.mp4"></video>

                    <div className="relative w-[100px] h-[100px] overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                            <video autoPlay loop muted className="w-[150%] h-auto object-cover rounded-full">
                                <source src="/images/anicircle.mp4" type="video/mp4" />
                            </video>
                            <Image
                                src="/images/radio1.jpeg"
                                alt="Radio Right"
                                width={100}
                                height={100}
                                className="absolute p-1 sm:p-4 rounded-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col w-full max-w-[80%] mx-auto stretch">
                    <div className="text-white w-full pb-24 mb-16">
                        {/* Song Generation Status Display */}
                        {isGenerating && (
                            <div className="mb-6 p-4 bg-blue-900/50 rounded-lg border border-blue-500/50">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <h3 className="font-semibold">🎵 Generating: {currentSongData?.title || 'New Song'}</h3>
                                        <p className="text-sm text-gray-300">Status: {generationStatus}</p>
                                    </div>
                                    <span className="text-sm text-gray-400">{formatTime(generationTime)}</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${generationProgress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400">
                                    Status checked every 20 seconds. This usually takes 1-3 minutes.
                                </p>
                                {generationError && (
                                    <div className="mt-2">
                                        <p className="text-red-400 text-sm">Error: {generationError}</p>
                                        <button
                                            onClick={() => window.location.href = '/payment'}
                                            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            Buy Credits
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {errorMessage && !showPaymentPrompt && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg max-w-3xl mx-auto">
                                {errorMessage}
                            </div>
                        )}
                        {/* Messages */}
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <MessageItem
                                    key={message.id}
                                    message={message}
                                    isGenerating={isGenerating}
                                    generationStatus={generationStatus}
                                    currentSongData={currentSongData}
                                    onCreateSong={handleCreateSong}
                                />
                            ))}
                        </div>
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 pb-8 px-4 mt-8">
                        <form onSubmit={handleSubmitMemoized} className="max-w-4xl mx-auto">
                            <div className="relative flex items-center bg-gray-700/50 backdrop-blur-lg rounded-2xl border border-gray-600/50 shadow-2xl overflow-hidden">
                                <input
                                    ref={inputRef}
                                    className="w-full p-4 pr-16 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                                    value={input}
                                    placeholder={showPaymentPrompt ? "Please purchase credits to continue..." : "Type your message or use voice..."}
                                    onChange={handleInputChangeMemoized}
                                    disabled={showPaymentPrompt}
                                />
                                <div className="absolute right-3 flex items-center space-x-2">
                                    {!input && (
                                        <button
                                            type="button"
                                            onClick={() => setIsVoiceAssistantActive(!isVoiceAssistantActive)}
                                            className={`p-2 rounded-full transition-colors ${isVoiceAssistantActive ? 'text-red-500 hover:bg-red-500/20' : 'text-blue-400 hover:bg-blue-500/20'}`}
                                            title={isVoiceAssistantActive ? 'Stop Voice Assistant' : 'Start Voice Assistant'}
                                        >
                                            {isVoiceAssistantActive ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
                                        </button>
                                    )}
                                    {input.length > 0 && (
                                        <button
                                            type="submit"
                                            className="p-2 rounded-full text-blue-400 hover:bg-blue-500/20 transition-colors"
                                            disabled={isLoading}
                                        >
                                            <IoMdSend size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                        {isVoiceAssistantActive ? (
                            <div className="mt-4 max-w-4xl mx-auto">
                                <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-4 border border-gray-700/50 shadow-lg">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-sm text-gray-300">Voice Assistant is active. Start typing to switch back to chat.</p>
                                    </div>
                                    <VoiceAssistantV3 autoStart={false} compact={true} />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center mt-2">
                                <button
                                    onClick={() => setIsVoiceAssistantActive(true)}
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1 mx-auto"
                                >
                                    <FaMicrophone size={14} />
                                    <span>Use Voice Assistant</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}