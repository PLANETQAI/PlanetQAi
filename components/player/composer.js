import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const MusicGenerator = () => {
  const [genre, setGenre] = useState('');
  const [instrument, setInstrument] = useState('');
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState('');
  const [tempo, setTempo] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const audioContext = useRef(null);

  useEffect(() => {
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const getConfig = () => {
    return {
      TYPE: process.env.NEXT_PUBLIC_TYPE || 'HF',
      API_URL: process.env.NEXT_PUBLIC_API_URL,
      TOKEN: process.env.NEXT_PUBLIC_ACCESS_TOKEN,
      CUSTOM_URL: process.env.NEXT_PUBLIC_CUSTOM_URL,
    };
  };

  const getHeaders = (token) => {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const createPrompt = () => {
    const promptParts = [genre, instrument, mood, energy, tempo, description];
    return promptParts.filter(part => part !== '').join(', ');
  };

  const createPayload = (prompt, duration, config) => {
    if (config.TYPE === 'CUSTOM') {
      return { prompt, duration: parseInt(duration) };
    } else {
      return { inputs: { prompt, duration: parseInt(duration) } };
    }
  };

  const processAudio = async (audioData, sampleRate) => {
    const audioArray = new Float32Array(audioData);
    const newAudioBuffer = audioContext.current.createBuffer(1, audioArray.length, sampleRate);
    newAudioBuffer.getChannelData(0).set(audioArray);
    setAudioBuffer(newAudioBuffer);
  };

  const generateAudio = async () => {
    setLoading(true);
    setError('');
    setAudioBuffer(null);

    const config = getConfig();
    const prompt = createPrompt();
    setGeneratedPrompt(prompt);

    if (prompt && duration) {
      try {
        const payload = createPayload(prompt, duration, config);
        let response;

        if (config.TYPE === 'CUSTOM') {
          response = await axios.post(config.CUSTOM_URL, payload);
        } else {
          response = await axios.post(config.API_URL, payload, {
            headers: getHeaders(config.TOKEN),
          });
        }

        // Process the audio data
        const audioData = response.data[0].generated_audio;
        const sampleRate = response.data[0].sample_rate;
        await processAudio(audioData, sampleRate);
      } catch (error) {
        setError(`Error generating audio: ${error.message}`);
      }
    } else {
      setError('Please fill in at least one field and set a duration.');
    }

    setLoading(false);
  };

  const playAudio = () => {
    if (audioBuffer) {
      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current.destination);
      source.start();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">PlanetQ Music Generator</h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Genre (e.g., Pop, Jazz, Classical)"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Main Instrument"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Mood"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Energy Level"
          value={energy}
          onChange={(e) => setEnergy(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Tempo"
          value={tempo}
          onChange={(e) => setTempo(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Additional Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Duration (in seconds)</label>
        <input
          type="number"
          min="10"
          max="60"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="p-2 border rounded w-full"
        />
      </div>

      <textarea
        value={generatedPrompt}
        readOnly
        className="p-2 border rounded w-full mb-4"
        rows="3"
        placeholder="Generated Prompt"
      />

      <button
        onClick={generateAudio}
        disabled={loading}
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        {loading ? 'Generating...' : 'Generate Audio'}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {audioBuffer && (
        <div className="mt-4">
          <button
            onClick={playAudio}
            className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Play Generated Audio
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicGenerator;
