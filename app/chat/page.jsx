'use client';

import CreditPurchaseModal from '@/components/credits/CreditPurchaseModal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useGenerator } from '@/context/GeneratorContext';
import { useUser } from '@/context/UserContext';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaMusic } from "react-icons/fa";
import StarsWrapper from '../../components/canvas/StarsWrapper';
import QuaylaGenerator from "./_components/Generator_v1";
import ExperienceHead from './avatar/_components/ExperienceHead';


export default function TestPage() {
  const { data: session, status } = useSession();
  const [voiceSession, setVoiceSession] = useState();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [songData, setSongData] = useState(null);
  const [currentAIMessage, setCurrentAIMessage] = useState("");
  const [showRecentActions, setShowRecentActions] = useState(false);
  const { openGenerator, closeGenerator, showGenerator } = useGenerator();
  const {
    credits: userCredits,
    creditsLoading,
    creditsError,
    fetchUserCredits
  } = useUser();
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  console.log("Current AI Message:", currentAIMessage);
  console.log("Chat History:", chatHistory);

  const handleGenerateSong = useCallback(async (songData) => {
    if (!session) {
      setErrorMsg("Please sign in to generate songs");
      return;
    }

    try {
      // Check if user has enough credits
      const credits = await fetchUserCredits();
      if (!credits || credits.credits < 85) { // Assuming 85 is the minimum required credits
        setShowCreditPurchaseModal(true);
        return false;
      }

      setSongData(songData);
      openGenerator();
      return true;
    } catch (error) {
      console.error('Error checking credits:', error);
      setErrorMsg("Failed to check credits. Please try again.");
      return false;
    }
  }, [session, openGenerator, fetchUserCredits]);

  const initializeSession = useCallback(async () => {
    if (voiceSession) return voiceSession;

    const { createSession } = await import("../../lib/voice/voiceAgent.js");
    const session = createSession();

    // Handle assistant messages and audio synchronization
    session.on("message", (message) => {
      console.log("Assistant message received:", message);
      if (message.role === "assistant" && message.content?.length > 0) {
        // Find the first content item with a transcript
        const contentItem = message.content.find(c => c.transcript);

        // Extract the transcript text
        const textContent = contentItem?.transcript || "";

        if (textContent) {
          // Set the message immediately when we receive it
          setCurrentAIMessage(textContent);
          console.log("Assistant message set:", textContent);
        }
      }
    });

    // Clear the message when the AI is done speaking
    session.on("speaking_ended", () => {
      setCurrentAIMessage("");
    });

    session.on("history_updated", (newHistory) => {
      setChatHistory(prevHistory => {
        // Only update if the history actually changed
        if (JSON.stringify(prevHistory) === JSON.stringify(newHistory)) {
          return prevHistory;
        }

        // No need to update currentAIMessage here as it's handled in the initial load effect

        return newHistory || [];
      });
    });

    setVoiceSession(session);
    return session;
  }, [voiceSession]);

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      if (voiceSession) {
        voiceSession.close().catch(console.error);
      }
    };
  }, [voiceSession]);

  // Initialize and update message from history when component mounts or chatHistory changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      const lastAssistantMessage = [...chatHistory]
        .reverse()
        .find(msg => msg.role === "assistant");

      if (lastAssistantMessage && lastAssistantMessage.content?.length > 0) {
        // Find the first content item with a transcript
        const contentItem = lastAssistantMessage.content.find(c => c.transcript);

        // Extract the transcript text
        const textContent = contentItem?.transcript || "";

        if (textContent) {
          setCurrentAIMessage(textContent);
          console.log("Initial message set from history:", textContent);
        }
      }
    }

    if (session?.user) {
      fetchUserCredits().catch(console.error);
    }
  }, [session, fetchUserCredits, chatHistory]);

  useEffect(() => {
    // Find the most recent create_song call by reversing the array
    const createSongCall = [...chatHistory]
      .reverse()
      .find(
        (item) =>
          item.type === "function_call" &&
          item.name === "create_song" &&
          item.parsedArguments
      );

    if (createSongCall && createSongCall.parsedArguments) {
      setSongData({
        title: createSongCall.parsedArguments.title || 'Untitled',
        description: createSongCall.parsedArguments.description || '',
        genre: createSongCall.parsedArguments.genre || 'pop',
        mood: createSongCall.parsedArguments.mood || 'neutral'
      });
      setShowGenerator(true);
    }
  }, [chatHistory]);

  const connect = async () => {
    setConnecting(true);
    setErrorMsg("");

    try {
      // Initialize session if not already done
      const session = await initializeSession();

      const { getToken } = await import("../../lib/voice/voiceAgent.js");
      const { token } = await getToken();

      // Connect with WebRTC options
      await session.connect({
        apiKey: token,
        useInsecureApiKey: true, // Required for browser WebRTC with regular API key
        transport: 'webrtc',
        voice: {
          // Add any additional voice configuration here
        },
        // Add additional WebRTC configuration
        webrtcConfig: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // Google's public STUN server
            // Add TURN servers here if needed
          ]
        }
      });

      setConnected(true);
    } catch (err) {
      const errorMessage = err.message === "INSUFFICIENT_CREDITS"
        ? "Insufficient credits. Please purchase more credits to continue."
        : err.message || "Connection failed";

      setErrorMsg(errorMessage);
      console.error("Connection error:", err);

      // If it's a credit error, show the credit purchase modal
      if (err.message === "INSUFFICIENT_CREDITS") {
        // You might want to trigger a credit purchase modal here
        // setShowCreditModal(true);
      }
    } finally {
      setConnecting(false);
    }
    setChatHistory((prev) => [
      ...prev,
      {
        role: "assistant",
        type: "message",
        content: [
          {
            type: "output_text",
            text: "🎶 Hey, welcome! Ready to create some music?",
          },
        ],
      },
    ]);
  };

  const disconnect = () => {
    if (voiceSession) {
      voiceSession.close();
      setConnected(false);
    }
  };

  useEffect(() => {
    if (showGenerator && connected) {
      disconnect();
    }
  }, [showGenerator, connected]);

  // Show controls after 6 seconds to ensure model is loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setControlsVisible(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const getMessageContent = (item) => {
    if (!item.content) return "Message";

    // Ensure we always deal with an array
    const contentArray = Array.isArray(item.content)
      ? item.content
      : [item.content];

    return contentArray
      .map((c) => {
        switch (c.type) {
          case "output_text":
            return c.text;
          case "tool_response":
            return `🔧 Tool response: ${c.output || "done"}`;
          case "input_text":
            return `🗣️ ${c.text}`;
          default:
            return JSON.stringify(c); // fallback for debugging
        }
      })
      .join("\n");
  };

  const formatFunctionOutput = (item) => {
    return `✅ Tool Result: ${typeof item.output === "string"
      ? item.output
      : JSON.stringify(item.output, null, 2)
      }`;
  };

  const formatFunctionCall = (item) => {
    const tool = item.name || "Unknown tool";
    const args = item.parsedArguments
      ? item.parsedArguments
      : item.arguments
        ? JSON.parse(item.arguments)
        : {};

    return (
      <div className="space-y-4 p-4 rounded-xl shadow-md border border-gray-800">
        {/* Tool Section */}
        <div>
          <div className="font-semibold text-purple-400 mb-1">🔧 Tool</div>
          <div className="bg-gray-900 px-4 py-2 rounded-lg text-gray-100 font-mono text-sm">
            {tool}
          </div>
        </div>
        <div>
          <div className="bg-gray-900 rounded-lg p-4 shadow-inner border border-gray-800 space-y-2">
            {Object.entries(args).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="text-gray-400 font-medium text-sm">{key}</span>
                <span className="text-gray-100 font-mono text-sm bg-gray-800 px-2 py-1 rounded">
                  {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Button */}
        {item.name === "create_song" && (
          <div className="pt-2">
            <button
              onClick={async () => {
                const songData = {
                  title: args.title || 'Untitled',
                  description: args.description || `A ${args.mood || 'catchy'} ${args.genre || 'pop'} song`,
                  style: args.style || '',
                  text: args.text || '',
                  tags: args.tags || [],
                  tempo: args.tempo || 'medium',
                  mood: args.mood || 'neutral'
                };
                handleGenerateSong(songData);
              }}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 
              px-4 py-2 rounded-lg text-sm font-medium text-white shadow transition-all duration-200 flex items-center"
            >
              <FaMusic className="mr-2" /> Create Song
            </button>
          </div>
        )}
      </div>
    );
  };


  return (
    <main className="w-full h-screen flex items-center justify-center p-4">
      <StarsWrapper className="fixed inset-0 -z-10" />
      {showGenerator && session && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-3xl relative">
            <button
              onClick={closeGenerator}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mt-8 p-6 bg-gray-800 rounded-lg max-h-[calc(90vh-4rem)] overflow-y-auto">
              <QuaylaGenerator
                session={session}
                selectedPrompt={songData}
                onCreditsUpdate={fetchUserCredits}
                onClose={closeGenerator}
              />
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-5xl flex flex-col items-center">
        <div className="w-full h-[80vh] rounded-lg overflow-hidden">
          <ExperienceHead />
        </div>
        <div className='fixed bottom-16 left-0 right-0 z-10'>   {/* Status Text */}
          <div className={`text-center text-lg font-medium mb-6 transition-opacity duration-500 ${controlsVisible ? 'opacity-100' : 'opacity-0'} ${connected ? 'text-green-400' : 'text-gray-400'}`}>
            {connected ? '🎤 Listening...' : connecting ? 'Connecting...' : 'Tap the button below to start'}
          </div>

          {/* Controls */}
          <div className={`w-full space-y-4 max-w-md mx-auto px-4 transition-opacity duration-500 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
            {!connected && !connecting ? (
              <div className="w-full flex justify-center">
                <button
                  onClick={(e) => {
                    if (userCredits?.credits < 160) {
                      e.preventDefault();
                      setShowCreditPurchaseModal(true);
                    } else {
                      connect();
                    }
                  }}
                  className={`group relative w-20 h-20 flex flex-col items-center justify-center ${userCredits?.credits < 160
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-red-500/30'
                    } text-white rounded-full font-medium shadow-lg transition-all duration-300`}
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <FaMicrophone className="text-2xl" />
                  </span>
                  <span className="text-xs mt-1">
                    {userCredits?.credits < 160 ? 'Insufficient' : ''}
                  </span>
                  {userCredits?.credits >= 160 && (
                    <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
                  )}
                </button>
              </div>
            ) : connected ? (
              <div className="w-full flex justify-center">
              <button
                onClick={disconnect}
                className="group relative w-20 h-20 flex flex-col items-center justify-center bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full font-medium shadow-lg hover:shadow-red-500/30 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <FaMicrophoneSlash className="text-2xl" />
                </span>
                {/* <span className="text-xs mt-1">Stop</span> */}
                <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
              </button>
              </div>
            ) : null}

            {errorMsg && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <svg className="h-5 w-5 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-100">Something went wrong</h3>
                    <div className="mt-1 text-sm text-red-200">
                      {errorMsg}
                    </div>
                    <div className="mt-3 flex">
                      <a
                        href="mailto:planetproductions@yahoo.com"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-100 bg-red-800 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        Contact Support
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div></div>

      </div>

      {/* Recent Actions Dialog */}
      <Dialog open={showRecentActions} onOpenChange={setShowRecentActions}>
        <DialogContent className="sm:max-w-2xl bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Recent Actions</DialogTitle>
            <DialogDescription className="text-gray-400">
              View your recent song generation actions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {Array.from(
              chatHistory
                .filter((item) => item.type === "function_call" && item.name === "create_song")
                .reduce((map, item) => {
                  if (!map.has(item.parsedArguments?.title)) {
                    map.set(item.parsedArguments?.title, item);
                  }
                  return map;
                }, new Map())
                .values()
            ).map((item, index) => (
              <div key={index} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <div className="text-cyan-300 whitespace-pre-wrap text-sm">
                  <h4 className="font-medium text-white mb-2">{item.parsedArguments?.title || 'Untitled Song'}</h4>
                  <p className="text-gray-300 text-sm mb-2">{item.parsedArguments?.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.parsedArguments?.genre && (
                      <span className="px-2 py-1 bg-gray-700/50 text-xs rounded-full text-gray-300">
                        {item.parsedArguments.genre}
                      </span>
                    )}
                    {item.parsedArguments?.mood && (
                      <span className="px-2 py-1 bg-gray-700/50 text-xs rounded-full text-gray-300">
                        {item.parsedArguments.mood}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowRecentActions(false)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {session && (
        <CreditPurchaseModal
          isOpen={showCreditPurchaseModal}
          onClose={() => setShowCreditPurchaseModal(false)}
          creditsNeeded={0}
          onSuccess={() => {
            fetchUserCredits()
          }}
        />
      )}
    </main>
  );
}
