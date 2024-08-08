import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const MusicGenerator = ({ selectedPrompt, onPromptChange }) => {
  const [makeInstrumental, setMakeInstrumental] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    // This effect will run whenever selectedPrompt changes
    // It's not strictly necessary but can be useful for debugging
    console.log('Selected prompt updated:', selectedPrompt);
  }, [selectedPrompt]);

  const handleInputChange = (field, value) => {
    onPromptChange({
      ...selectedPrompt,
      [field]: value
    });
  };

  const generateAudio = async () => {
    setLoading(true);
    setError('');
    setGeneratedAudio(null);

    const url = 'https://api.aimlapi.com/generate/custom-mode';
    const headers = {
      'Authorization': 'Bearer YOUR_API_KEY', // Replace with your actual API key
      'Content-Type': 'application/json'
    };
    const payload = {
      prompt: selectedPrompt.text,
      tags: selectedPrompt.tags,
      title: selectedPrompt.title,
      make_instrumental: makeInstrumental,
      wait_audio: true
    };

    try {
      const response = await axios.post(url, payload, { headers, responseType: 'arraybuffer' });
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setGeneratedAudio(audioUrl);
    } catch (error) {
      setError(`Error generating audio: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-xl">
      <h3 className="text-2xl font-bold mb-4 text-white">Generate Custom Music</h3>

      <div className="mb-4">
        <textarea
          placeholder="Enter prompt (use [Verse], [Chorus], [Bridge] for lyrics)"
          value={selectedPrompt.text}
          onChange={(e) => handleInputChange('text', e.target.value)}
          className="bg-gradient-to-t from-slate-700 to-slate-600 p-3 border border-slate-500 text-white w-full rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows="6"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Tags (e.g., dance, energetic)"
          value={selectedPrompt.tags}
          onChange={(e) => handleInputChange('tags', e.target.value)}
          className="bg-gradient-to-t from-slate-700 to-slate-600 p-3 border border-slate-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          type="text"
          placeholder="Title"
          value={selectedPrompt.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="bg-gradient-to-t from-slate-700 to-slate-600 p-3 border border-slate-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="mb-6">
        <label className="flex items-center text-white cursor-pointer">
          <input
            type="checkbox"
            checked={makeInstrumental}
            onChange={(e) => setMakeInstrumental(e.target.checked)}
            className="mr-2 form-checkbox h-5 w-5 text-purple-500 rounded focus:ring-purple-500"
          />
          Make Instrumental
        </label>
      </div>

      <button
        onClick={generateAudio}
        disabled={loading}
        className="bg-purple-600 text-white p-3 rounded-md hover:bg-purple-700 transition-colors duration-300 w-full font-semibold"
      >
        {loading ? 'Generating...' : 'Generate Audio'}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {generatedAudio && (
        <div className="mt-6">
          <h4 className="text-white mb-2 font-semibold">Generated Audio:</h4>
          <audio ref={audioRef} controls src={generatedAudio} className="w-full" />
        </div>
      )}
    </div>
  );
};

export default MusicGenerator;