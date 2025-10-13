"use client";

import CreditPurchaseModal from "@/components/credits/CreditPurchaseModal";
import { useGenerator } from "@/context/GeneratorContext";
import { useUser } from "@/context/UserContext";
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaMusic } from "react-icons/fa";
import QuaylaGenerator from "./Generator_v1";

export default function VoiceAssistant() {
  const { data: session, status } = useSession();
  const [voiceSession, setVoiceSession] = useState();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [songData, setSongData] = useState(null);
  const { openGenerator, closeGenerator, showGenerator } = useGenerator();
  const { 
    credits: userCredits, 
    creditsLoading, 
    creditsError, 
    fetchUserCredits 
  } = useUser();
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);

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

    const { createSession } = await import("../../../lib/voice/voiceAgent.js");
    const session = createSession();

    session.on("history_updated", (newHistory) => {
      setChatHistory(newHistory || []);
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

  // Fetch user credits on component mount and when session changes
  useEffect(() => {
    if (session?.user) {
      fetchUserCredits().catch(console.error);
    }
  }, [session, fetchUserCredits]);

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

      const { getToken } = await import("../../../lib/voice/voiceAgent.js");
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
      <div className="space-y-4 p-4 rounded-xl bg-gray-950 shadow-md border border-gray-800">
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
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Generator Component */}
      {showGenerator && session && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
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
      <div className="container mx-auto px-4 py-8 max-w-4xl flex flex-col items-center justify-center">
        <div className="relative  w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-120 lg:h-120   mb-4">
          <div className={`absolute inset-0 rounded-full ${connected
            ? 'bg-gradient-to-r from-green-400 to-blue-500'
            : 'bg-gradient-to-r from-gray-400 to-gray-600'
            } p-0.5`}>
            <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-900">
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
        <div className="space-y-4">
          {!connected && !connecting && (
            <button
              onClick={connect}
              className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full font-medium shadow-lg hover:shadow-red-500/30 transition-all duration-300 overflow-hidden w-full text-center"
            >
              <span className="relative z-10 flex items-center justify-center">
                <FaMicrophone className="mr-2" />
                Start Assistant
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          )}
          {connected && (
            <button
              onClick={disconnect}
              className="group w-full relative px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full font-medium shadow-lg hover:shadow-red-500/30 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center">
                <FaMicrophoneSlash className="mr-2" />
                Stop Assistant
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          )}

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
                    We're having trouble processing your request. Please try again in a moment.
                  </div>
                  <div className="mt-3 flex">
                    <a
                      href="/support"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-100 bg-red-800 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {connected && (
            <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
              🎤 Ready to create music! Start talking to begin.
            </div>
          )}
        </div>
        {chatHistory.length > 0 && (
          <div className="mt-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Array.from(
                chatHistory
                  .filter((item) => item.type === "function_call")
                  .reduce((map, item) => {
                    // Use function name as key to ensure uniqueness
                    if (!map.has(item.name)) {
                      map.set(item.name, item);
                    }
                    return map;
                  }, new Map())
                  .values()
              ).map((item, index) => (
                <div key={index} className="p-3 rounded">
                  <div className="text-cyan-300 whitespace-pre-wrap">
                    {formatFunctionCall(item)}
                  </div>
                </div>
              ))}
              {/* {chatHistory
                .filter((item) => item.type === "function_call") // ✅ only show function calls
                .map((item, index) => (
                  <div key={index} className="p-3 rounded">
                    <div className="text-cyan-300 whitespace-pre-wrap">
                      {formatFunctionCall(item)}
                      <div className="mt-2 space-x-2">
                        {item.name === "create_song" && (
                          <button
                            onClick={() =>
                              handleCreateSong(
                                JSON.stringify(item.parsedArguments, null, 2)
                              )
                            }
                            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                          >
                            Handle Create Song
                          </button>
                        )}
                        {item.name === "save_progress" && (
                          <button
                            onClick={() =>
                              handleSaveProgress(
                                JSON.stringify(item.parsedArguments, null, 2)
                              )
                            }
                            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                          >
                            Handle Save Progress
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))} */}
            </div>
          </div>
        )}


        {/* {chatHistory.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {chatHistory.map((item, index) => (
                <div key={index} className="flex space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${item.role === "user" ? "bg-blue-600" : "bg-purple-600"
                      }`}
                  >
                    {item.role === "user" ? "U" : "AI"}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-300">
                      {item.type === "message" && (
                        <div className="whitespace-pre-wrap">
                          {getMessageContent(item)}
                        </div>
                      )}
                      {item.type === "function_call" && (
                        <div className="text-cyan-300 whitespace-pre-wrap">
                          {formatFunctionCall(item)}
                          <div className="mt-2 space-x-2">
                            {item.name === "create_song" && (
                              <button
                                onClick={() =>
                                  handleCreateSong(
                                    JSON.stringify(
                                      item.parsedArguments,
                                      null,
                                      2
                                    )
                                  )
                                }
                                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                              >
                                Handle Create Song
                              </button>
                            )}
                            {item.name === "save_progress" && (
                              <button
                                onClick={() =>
                                  handleSaveProgress(
                                    JSON.stringify(
                                      item.parsedArguments,
                                      null,
                                      2
                                    )
                                  )
                                }
                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                              >
                                Handle Save Progress
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {item.type === "function_call_output" && (
                        <div className="text-green-300 text-sm whitespace-pre-wrap">
                          {formatFunctionOutput(item)}
                        </div>
                      )}
                      {item.type === "error" && (
                        <div className="text-red-300 whitespace-pre-wrap">
                          {getMessageContent(item)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} */}
      </div>

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
    </div>
  );
}