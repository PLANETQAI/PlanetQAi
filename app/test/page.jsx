
import VoiceNavigationAssistant from '@/components/common/QuaylaAssistants';

function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Voice Navigation Assistant Test</h1>
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <VoiceNavigationAssistant />
      </div>
    </div>
  );
}

export default TestPage;