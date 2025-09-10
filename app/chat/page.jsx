import ChatBot from "./_components/chat-client";
import VoiceAssistant from "./_components/TestVoice";
import VoiceAssistantV3 from "./_components/VoiceAssistantV3";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RealtimePage() {
  const session = await auth()

  if (!session) {
		redirect('/login')
	}
  
  return (
    <div >
      <ChatBot session={session} /> 
      {/* 
      <VoiceAssistant /> */}
      {/* <VoiceAssistantV3 autoStart={false} compact={false} /> */}
    </div>
  );
}