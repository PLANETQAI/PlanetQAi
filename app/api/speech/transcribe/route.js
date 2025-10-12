// app/api/speech/stream-transcribe/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Navigation routes mapping
const navigationMap = {
  games: ['play games', 'games', 'game', 'play', 'gaming', 'start game'],
  aistudio: ['create song', 'music', 'ai studio', 'studio', 'create music', 'make song', 'compose', 'create', 'generate song'],
  'productions/album': ['listen to songs', 'check my songs', 'my songs', 'my album', 'my music'],
  productions: ['listen to radio', 'radio', 'ai radio', 'radio station'],
  'video-player': ['video', 'videos', 'gallery', 'watch video', 'video player', 'my videos'],
  home: ['home', 'main page', 'homepage', 'go home', 'start', 'main menu'],
  about: ['about', 'about us', 'information', 'who are you'],
  contact: ['contact', 'reach out', 'get in touch', 'contact us', 'support']
};

// Check if transcription contains navigation command
function checkNavigation(text) {
  const lowerText = text.toLowerCase().trim();
  
  // Check for exit commands
  if (['exit', 'stop', 'goodbye', 'that\'s all', 'thank you'].some(cmd => lowerText.includes(cmd))) {
    return { action: 'exit', message: 'Goodbye! Have a great day!' };
  }

  // Check for greetings
  if (['hello', 'hi', 'hey', 'hi there'].some(greeting => lowerText.includes(greeting))) {
    return { action: 'greeting', message: 'Hello! How can I help you today?' };
  }

  // Check for help
  if (lowerText.includes('help') || lowerText.includes('what can you do')) {
    return { 
      action: 'help', 
      message: 'I can help you navigate the app. Try saying: "Play games", "Create a song", or "Go to my music"' 
    };
  }

  // Check navigation commands
  for (const [route, keywords] of Object.entries(navigationMap)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return {
        action: 'navigate',
        route: route,
        message: `Taking you to ${route.replace('-', ' ')}.`
      };
    }
  }

  return null;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const isStreaming = formData.get('streaming') === 'true';
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create a file-like object from the Blob
    const file = new File([audioFile], 'recording.webm', { type: 'audio/webm' });
    
    // Use Whisper for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json', // Get timestamps for better streaming simulation
      language: 'en' // Specify language for better accuracy
    });

    const text = transcription.text;
    
    // Check if the transcription contains a navigation command
    const navigationResult = checkNavigation(text);
    
    if (navigationResult) {
      return NextResponse.json({
        text: text,
        navigation: navigationResult
      });
    }

    // Return regular transcription without navigation
    return NextResponse.json({ 
      text: text,
      navigation: null
    });
    
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio',
        details: error.message 
      },
      { status: 500 }
    );
  }
}