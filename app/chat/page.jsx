import ChatBot from "./_components/chat-client";
import VoiceAssistant from "./_components/TestVoice";
import VoiceAssistantV3 from "./_components/VoiceAssistantV3";

export default function RealtimePage() {
  return (
    <div >
      {/* <ChatBot />
      <VoiceAssistant /> */}
      <VoiceAssistantV3 autoStart={false} compact={false} />
    </div>
  );
}