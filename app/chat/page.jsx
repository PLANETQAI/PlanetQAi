
import { auth } from "@/auth";
import GlobalHeader from "@/components/planetqproductioncomp/GlobalHeader";
import { redirect } from "next/navigation";
import VoiceAssistant from "./_components/Voice";

export default async function RealtimePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div >
      <GlobalHeader session={session} />
      <VoiceAssistant />
    </div>
  );
}