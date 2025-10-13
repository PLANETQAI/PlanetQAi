import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Navigation routes mapping with improved patterns and synonyms
const navigationMap = {
  '/': {
    patterns: [
      /^(?:go\s+)?home$/i,
      /^(?:main|start|menu)$/i,
      /(?:go|take|navigate|return)\s+(?:me\s+)?to\s+(?:the\s+)?(home|main\s+(page|menu|screen))/i,
      /(?:can\s+you\s+)?(?:go\s+back|return|start\s+over)/i,
      /(?:back\s+to\s+(?:the\s+)?(start|beginning))/i,
      /(?:i'?m\s+(done|finished))/i
    ],
    message: 'Going to the home page',
    synonyms: ['home', 'main page', 'homepage', 'menu', 'go home']
  },

  aistudio: {
    patterns: [
      /^(create|make|compose|produce|generate)\s+(song|music|beat|track)$/i,
      /^(ai\s*)?(studio|music\s+studio|song\s+studio)$/i,
      /(?:open|go\s+to|navigate\s+to)\s+(?:the\s+)?(studio|ai\s*studio|music\s+creator)/i,
      /(?:can\s+you\s+)?(?:make|create)\s+(?:some\s+)?(music|song)/i,
      /(?:i\s+want\s+to\s+|let'?s\s+)?(make|create|try)\s+(?:a\s+)?(beat|song|music)/i
    ],
    message: 'Opening AI Studio to create music',
    synonyms: ['ai studio', 'music studio', 'create song', 'make music', 'song creator']
  },

  planetqgames: {
    patterns: [
      /^(play|games?|gaming)$/i,
      /(?:go|navigate|open|take|show)\s+(?:me\s+)?(?:to\s+)?(games?|gaming|game\s+section)/i,
      /(?:i\s+want\s+to\s+|i'?d\s+like\s+to\s+)?(play|see|try|access)\s+(games?|something\s+fun)/i,
      /(?:let'?s\s+)?(have|play)\s+(some\s+)?fun/i
    ],
    message: 'Opening games section',
    synonyms: ['games', 'game', 'play games', 'gaming', 'game section']
  },

  productions: {
    patterns: [
      /^(radio|music|listen|station)$/i,
      /(?:play|start|open|turn\s+on)\s+(?:the\s+)?(radio|ai\s*radio|station)/i,
      /(?:i\s+want\s+to\s+|let'?s\s+)?(listen|tune\s+in)\s+(?:to\s+)?(music|radio)/i,
      /(?:background\s+music|something\s+to\s+listen\s+to)/i
    ],
    message: 'Tuning into the AI Radio station',
    synonyms: ['radio', 'ai radio', 'music station', 'listen to radio']
  },

  'productions/album': {
    patterns: [
      /^(album|library|my\s+(songs?|tracks?|music))$/i,
      /(?:open|show|view|see|go\s+to)\s+(?:my\s+)?(album|songs?|tracks?|music|library)/i,
      /(?:play|listen\s+to)\s+(?:my\s+)?(music|album|songs?|tracks?)/i,
      /(?:show\s+me\s+what\s+i'?ve\s+created|my\s+creations)/i
    ],
    message: 'Opening your music library',
    synonyms: ['my songs', 'my music', 'album', 'library', 'song collection']
  },

  'productions/about': {
    patterns: [
      /^(about|info|help|who\s+are\s+you|what\s+is\s+this)$/i,
      /(?:tell\s+me|show\s+me)\s+(?:more\s+)?about\s+(you|this|the\s+app)/i,
      /(?:i\s+want\s+to\s+learn|know)\s+(?:more\s+)?about\s+(you|planet\s+q)/i,
      /(?:how\s+does\s+this\s+work|what\s+can\s+i\s+do\s+here)/i,
      /(?:who\s+made\s+you|what'?s\s+this\s+about)/i
    ],
    message: 'Showing information about us',
    synonyms: ['about', 'about us', 'information', 'who are you', 'help']
  },

  'video-player': {
    patterns: [
      /^(videos?|gallery|video\s*player|watch)$/i,
      /(?:open|show|view|go\s+to|navigate\s+to)\s+(?:my\s+)?(videos?|gallery|recordings?)/i,
      /(?:watch|see|browse)\s+(?:my\s+)?(videos?|gallery)/i,
      /(?:show\s+me\s+what\s+i'?ve\s+recorded|my\s+videos?)/i
    ],
    message: 'Opening video player',
    synonyms: ['videos', 'gallery', 'video player', 'my videos', 'watch videos']
  }
};


// Check if transcription contains navigation command with improved matching
function checkNavigation(text) {
  const lowerText = text.toLowerCase().trim();
  
  // 1. First try exact matches with synonyms for quick response
  for (const [route, data] of Object.entries(navigationMap)) {
    if (data.synonyms.some(synonym => 
      new RegExp(`\\b${synonym}\\b`, 'i').test(lowerText)
    )) {
      return {
        action: 'navigate',
        route: route,
        message: data.message
      };
    }
  }
  
  // 2. Try pattern matching for more complex phrases
  for (const [route, data] of Object.entries(navigationMap)) {
    if (data.patterns.some(pattern => pattern.test(lowerText))) {
      return {
        action: 'navigate',
        route: route,
        message: data.message
      };
    }
  }
  
  // 3. Try fuzzy matching as last resort
  for (const [route, data] of Object.entries(navigationMap)) {
    const words = lowerText.split(/\s+/);
    if (words.some(word => 
      data.synonyms.some(synonym => 
        synonym.split(/\s+/).some(synWord => 
          word.length > 3 && synonym.includes(word)
        )
      )
    )) {
      return {
        action: 'navigate',
        route: route,
        message: data.message
      };
    }
  }
  
  return null;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const file = new File([audioFile], 'recording.webm', { type: 'audio/webm' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en'
    });

    const text = transcription.text;
    const navigationResult = checkNavigation(text);
    
    return NextResponse.json({
      text: text,
      navigation: navigationResult
    });
    
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}