
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import VoiceAssistantV3 from "./_components/VoiceAssistantV3";
import GlobalHeader from "@/components/planetqproductioncomp/GlobalHeader";

export default async function RealtimePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div >
      <GlobalHeader session={session} />
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="p-4 flex flex-col items-center">
          <div className="mb-4">
            <p className="text-sm text-gray-300">Voice Assistant is active. Start typing to switch back to chat.</p>
          </div>
          <VoiceAssistantV3 autoStart={false} compact={true} />
        </div>
      </div>

    </div>
  );
}