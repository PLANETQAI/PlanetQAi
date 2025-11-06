'use client';

import CreditPurchaseModal from '@/components/credits/CreditPurchaseModal';
import GlobalHeader from '@/components/planetqproductioncomp/GlobalHeader';
import { useGenerator } from '@/context/GeneratorContext';
import { useUser } from '@/context/UserContext';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaMusic } from "react-icons/fa";
import StarsWrapper from '../../components/canvas/StarsWrapper';
import GenerateSong from './_components/GenerateSong';
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
  const { openGenerator, closeGenerator, showGenerator } = useGenerator();
  const {
    credits: userCredits,
    creditsLoading,
    creditsError,
    fetchUserCredits
  } = useUser();
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [hasToolCalls, setHasToolCalls] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState({ success: null, message: '' });
  const [songsToGenerate, setSongsToGenerate] = useState([]);
  const [showDialog, setShowDialog] = useState(false);

  // Update hasToolCalls and isGenerating based on chatHistory
  useEffect(() => {
    const toolCalls = chatHistory.filter(item => item.type === "function_call");
    const hasToolCallsNow = toolCalls.length > 0;

    // Find all create_song tool calls
    const createSongCalls = toolCalls
      .filter(item => item.name === 'create_song' && (item.arguments || item.parsedArguments))
      .map(call => {
        // Handle both arguments and parsedArguments
        const args = typeof call.arguments === 'string'
          ? JSON.parse(call.arguments)
          : call.parsedArguments || call.arguments || {};
        return { ...call, parsedArgs: args };
      });
    const hasCreateSongCall = createSongCalls.length > 0;
    console.log("hasToolCallsNow:", hasToolCallsNow);
    console.log("hasCreateSongCall:", hasCreateSongCall, createSongCalls);
    if (hasToolCallsNow && !hasToolCalls) {
      setHasToolCalls(true);
      setShowDialog(true)
      // If there are create_song calls, prepare the songs to generate
      if (hasCreateSongCall) {
        const songs = createSongCalls.map(({ parsedArgs }) => ({
          title: parsedArgs.title || 'Untitled',
          prompt: parsedArgs.description ||
            `A ${parsedArgs.mood || 'catchy'} ${parsedArgs.genre || 'pop'} song`,
          tags: parsedArgs.tags || [],
          mood: parsedArgs.mood || 'neutral',
          genre: parsedArgs.genre || 'pop',
          style: parsedArgs.style || '',
          tempo: parsedArgs.tempo || 'medium'
        }));


        setSongsToGenerate(songs);

      }
    }
  }, [chatHistory, hasToolCalls]);

  console.log("Current AI Message:", currentAIMessage);
  console.log("Chat History:", chatHistory);
  console.log("hasToolCalls:", hasToolCalls);
  console.log("songsToGenerate:", songsToGenerate);
  console.log("Song Data:", songData);

  const handleGenerateSong = useCallback(async (songData) => {
    console.log('handleGenerateSong called with:', songData);

    if (!session) {
      console.log('No session found');
      setErrorMsg("Please sign in to generate songs");
      return false;
    }

    try {
      console.log('Setting isGenerating to true');
      setIsGenerating(true);

      console.log('Fetching user credits...');
      const credits = await fetchUserCredits();
      console.log('User credits:', credits);

      if (!credits || credits.credits < 85) {
        console.log('Insufficient credits');
        setShowCreditPurchaseModal(true);
        setIsGenerating(false);
        return false;
      }

      console.log('Setting song data and opening generator');
      setSongData(songData);

      try {
        console.log('Calling openGenerator...');
        openGenerator();
        console.log('Setting up dialog close timeout');
        setTimeout(() => {
          console.log('Closing dialog');
          setIsGenerating(false);
          setHasToolCalls(false);
        }, 500);
        console.log('openGenerator called successfully');
      } catch (error) {
        console.error('Error in openGenerator:', error);
        throw error;
      }



      return true;
    } catch (error) {
      console.error('Error checking credits:', error);
      setErrorMsg("Failed to check credits. Please try again.");
      setIsGenerating(false);
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
      // First, check if we have any song calls
      const songCalls = newHistory
        .filter(item =>
          item.type === "function_call" &&
          item.name === "create_song" &&
          item.arguments
        );

      // Only update state if there are song calls
      if (songCalls.length > 0) {
        const songs = songCalls.map(call => ({
          title: call.arguments.title || 'Untitled',
          prompt: call.arguments.description ||
            `A ${call.arguments.mood || 'catchy'} ${call.arguments.genre || 'pop'} song`,
          tags: call.arguments.tags || [],
          mood: call.arguments.mood || 'neutral',
          genre: call.arguments.genre || 'pop',
          style: call.arguments.style || '',
          tempo: call.arguments.tempo || 'medium'
        }));

        setSongsToGenerate(songs);
        setShowDialog(true);
      }

      // Then update the chat history
      setChatHistory(prevHistory => {
        return JSON.stringify(prevHistory) === JSON.stringify(newHistory)
          ? prevHistory
          : (newHistory || []);
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
      // Find all assistant messages with function calls
      const assistantMessages = chatHistory.filter(
        msg => msg.role === "assistant" && msg.type === "function_call"
      );

      // Find all create_song tool calls in descending order
      const createSongCalls = assistantMessages
        .filter(item => item.name === 'create_song')
        .reverse(); // To maintain chronological order

      if (createSongCalls.length > 0) {
        const songs = createSongCalls.map(call => {
          // Safely parse arguments
          const args = call.arguments
            ? call.arguments
            : call.arguments
              ? JSON.parse(call.arguments)
              : {};

          return {
            title: args.title || 'Untitled',
            prompt: args.description ||
              `A ${args.mood || 'catchy'} ${args.genre || 'pop'} song`,
            tags: args.tags || [],
            mood: args.mood || 'neutral',
            genre: args.genre || 'pop',
            style: args.style || '',
            tempo: args.tempo || 'medium'
          };
        });

        console.log("Songs to generate:", songs);
        setSongsToGenerate(songs);
        setShowDialog(true);
      }

      // Handle text content from the last assistant message
      const lastAssistantMessage = [...chatHistory]
        .reverse()
        .find(msg => msg.role === "assistant" && msg.content?.length > 0);

      if (lastAssistantMessage?.content?.length > 0) {
        const contentItem = lastAssistantMessage.content.find(c => c.transcript);
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
    const args = item.arguments
      ? item.arguments
      : item.arguments
        ? JSON.parse(item.arguments)
        : {};

    return (
      <div className="space-y-4 p-4 rounded-xl shadow-md border border-gray-800">
        {/* Tool Section */}
        {/* <div>
          <div className="font-semibold text-purple-400 mb-1">🔧 Tool</div>
          <div className="bg-gray-900 px-4 py-2 rounded-lg text-gray-100 font-mono text-sm">
            {tool}
          </div>
        </div> */}
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
                setSongData(songData);
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
    <main >
      <StarsWrapper className="fixed inset-0 -z-10" />
      <GlobalHeader session={session} />
      <div className='w-full flex items-center justify-center'>
        <div className="w-full max-w-5xl flex flex-col items-center">
          <div className="w-full h-[80vh] rounded-lg overflow-hidden">
            <ExperienceHead />
          </div>
          <div className='fixed bottom-12 left-0 right-0 z-10'>   {/* Status Text */}
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

        <GenerateSong
          isOpen={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSongsToGenerate([]);
          }}
          songDetailsQueue={songsToGenerate}
          onSuccess={(newSongs) => {
            console.log('Song completed!', newSongs);
          }}
          onAllComplete={(allSongs) => {
            console.log('All songs done!', allSongs);
            setShowDialog(false);
            setSongsToGenerate([]);
            // You might want to refresh the songs list here
          }}
        />

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
    </main>
  );
}
