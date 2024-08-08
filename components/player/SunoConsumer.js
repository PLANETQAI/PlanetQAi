import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const MusicGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState('');
  const [title, setTitle] = useState('');
  const [makeInstrumental, setMakeInstrumental] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);

  const generateAudio = async () => {
    setLoading(true);
    setError('');
    setGeneratedAudio(null);

    const url = 'https://api.aimlapi.com/generate/custom-mode';
    const headers = {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    };
    const payload = {
      prompt,
      tags,
      title,
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
    <div className="max-w-2xl mx-auto p-4">
      <h3 className="text-2xl font-bold mb-4 text-white">Generate Custom Music</h3>

      <div className="mb-4">
        <textarea
          placeholder="Enter prompt (use [Verse], [Chorus], [Bridge] for lyrics)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-gradient-to-t from-slate-600 to-slate-500 p-2 border text-white w-full"
          rows="6"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Tags (e.g., dance, energetic)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="bg-gradient-to-t from-slate-600 to-slate-500 p-2 border text-white"
        />
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-gradient-to-t from-slate-600 to-slate-500 p-2 border text-white"
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center text-white">
          <input
            type="checkbox"
            checked={makeInstrumental}
            onChange={(e) => setMakeInstrumental(e.target.checked)}
            className="mr-2"
          />
          Make Instrumental
        </label>
      </div>

      <button
        onClick={generateAudio}
        disabled={loading}
        className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
      >
        {loading ? 'Generating...' : 'Generate Audio'}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {generatedAudio && (
        <div className="mt-4">
          <audio ref={audioRef} controls src={generatedAudio} className="w-full" />
        </div>
      )}
    </div>
  );
};

export default MusicGenerator;