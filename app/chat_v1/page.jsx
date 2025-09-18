"use client";

import { useState, useEffect } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaMusic, FaArrowRight } from "react-icons/fa";
import GlobalHeader from "@/components/planetqproductioncomp/GlobalHeader";
import { auth } from "@/auth";
import { redirect } from "next/navigation";



export default async function VoiceAssistant() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }
  const [voiceSession, setVoiceSession] = useState();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [songInformation, setSongInformation] = useState(null);

  console.log("Chat History:", songInformation);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import("../../lib/voice/voiceAgent.js").then(({ createSession }) => {
      const session = createSession();
      setVoiceSession(session);

      session.on("history_updated", (newHistory) => {
        setChatHistory(newHistory || []);
      });
    });
  }, []);

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
      setSongInformation(createSongCall.parsedArguments);
    }
  }, [chatHistory]);

  const connect = async () => {
    if (!voiceSession) return;

    setConnecting(true);
    setErrorMsg("");

    try {
      const { getToken } = await import("../../lib/voice/voiceAgent.js");
      const token = await getToken();
      await voiceSession.connect({
        apiKey: token,
        useInsecureApiKey: true, // Add this line
      });
      setConnected(true);
    } catch (err) {
      setErrorMsg(err.message || "Connection failed");
      console.error("Connection error:", err);
    }
    setConnecting(false);
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

  const stopTalking = () => {
    if (voiceSession) {
      voiceSession.interrupt();
    }
  };

  const markAsDone = () => {
    if (voiceSession) {
      // Alternative: Send as a text message that will trigger the tool
      voiceSession.sendMessage([
        {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: 'Please save progress with status "done" and title "Manual completion"',
            },
          ],
        },
      ]);
    }
  };

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

  // const formatFunctionCall = (item) => {
  //   const tool = item.name || "Unknown tool";
  //   const args = item.parsedArguments
  //     ? item.parsedArguments
  //     : item.arguments
  //     ? JSON.parse(item.arguments)
  //     : {};

  //   // optionally update song info if this tool is create_song
  //   if (item.name === "create_song" && item.parsedArguments) {
  //     setSongInformation(JSON.stringify(item.parsedArguments, null, 2));
  //   }

  //   return (
  //     <div className="space-y-2">
  //       <div className="font-semibold text-purple-400">🔧 Tool:</div>
  //       <div className="bg-gray-900 px-3 py-2 rounded text-gray-200">
  //         {tool}
  //       </div>

  //       <div className="font-semibold text-cyan-400">📝 Arguments:</div>
  //       <pre className="bg-gray-900 px-3 py-2 rounded text-gray-200 whitespace-pre-wrap">
  //         {JSON.stringify(args, null, 2)}
  //       </pre>
  //       <button onClick={() => handleCreateSong(args)} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm">Handle Create Song</button>
  //     </div>
  //   );
  // };


  // const formatFunctionCall = (item) => {
  //   let display = `🔧 Using tool: ${item.name || "Unknown tool"}`;

  //   if (item.parsedArguments) {
  //     display += `\n📝 Arguments: ${JSON.stringify(
  //       item.parsedArguments,
  //       null,
  //       2
  //     )}`;
  //     setSongInformation(JSON.stringify(item.parsedArguments, null, 2));
  //   } else if (item.arguments) {
  //     display += `\n📝 Arguments: ${item.arguments}`;
  //   }

  //   return display;
  // };

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

    // optionally update song info if this tool is create_song
    if (item.name === "create_song" && item.parsedArguments) {
      setSongInformation(JSON.stringify(item.parsedArguments, null, 2));
    }

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
        <div className="pt-2">
          <button
            onClick={() => handleCreateSong(args)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 
            px-4 py-2 rounded-lg text-sm font-medium text-white shadow transition-all duration-200"
          >
            Handle Create Song
          </button>
        </div>
      </div>
    );
  };


  const handleCreateSong = (args) => {
    console.log("Processing create_song with:", args);
    // Add your custom logic here for create_song
    // For example: save to local state, show in UI, etc.
  };

  const handleSaveProgress = (args) => {
    console.log("Processing save_progress with:", args);
    // Add your custom logic here for save_progress
    // For example: update progress indicators, save to database, etc.
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <GlobalHeader session={session} />
      <div className="container mx-auto px-4 py-8 max-w-4xl flex flex-col items-center justify-center">
        <div className="relative w-80 h-80 mb-4">
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
          {/* {!connected ? (
            <button
              onClick={connect}
              disabled={connecting}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg disabled:opacity-50 w-full"
            >
              {connecting ? "Connecting..." : "Connect"}
            </button>
          ) : (
            <div>
              <button
                onClick={stopTalking}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg mr-2"
              >
                Stop
              </button>
              <button
                onClick={disconnect}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
              >
                Disconnect
              </button>
            </div>
          )} */}
          {errorMsg && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              Error: {errorMsg}
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
              {chatHistory
                .filter((item) => item.type === "function_call") // ✅ only show function calls
                .map((item, index) => (
                  <div key={index} className="p-3 rounded">
                    <div className="text-cyan-300 whitespace-pre-wrap">
                      {formatFunctionCall(item)}
                      <div className="mt-2 space-x-2">
                        {/* {item.name === "create_song" && (
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
                        )} */}
                        {/* {item.name === "save_progress" && (
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
                        )} */}
                      </div>
                    </div>
                  </div>
                ))}
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
    </div>
  );
}
