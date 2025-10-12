import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Navigation routes mapping with improved patterns and synonyms
const navigationMap = {
  games: {
    patterns: [
      // Direct commands
      /^(?:let'?s?\s+)?(play|start|open|go\s+to|navigate\s+to|show\s+me|take\s+me\s+to)\s+(?:the\s+)?(games?|gaming|game\s+section)/i,
      // Questions
      /(?:can\s+you\s+)?(?:please\s+)?(open|show|go\s+to)\s+(?:the\s+)?(games?|gaming)/i,
      // General mentions
      /(?:i\s+(?:want\s+to\s+)?|i'?d\s+like\s+to\s+)?(play|try|see|view|access)\s+(?:the\s+)?(games?|gaming)/i,
      // Short forms
      /^(games?|gaming|play)$/i,
      // Edge cases
      /(?:take\s+me\s+to\s+the\s+)?(?:fun\s+)?(?:section|area)/i,
      /(?:let'?s?\s+)?have\s+some\s+fun/i
    ],
    message: 'Opening games section',
    synonyms: ['games', 'game', 'play games', 'gaming', 'start game', 'play game', 'game section']
  },
  aistudio: {
    patterns: [
      // Direct commands
      /^(?:let'?s?\s+)?(create|make|generate|open|go\s+to|navigate\s+to)\s+(?:a\s+)?(song|music|beat|track|studio|composition)/i,
      // Questions
      /(?:can\s+you\s+)?(?:please\s+)?(create|make|open)\s+(?:a\s+)?(song|music|beat|track)/i,
      // Specific features
      /(?:i\s+want\s+to\s+|i'?d\s+like\s+to\s+)?(create|make|generate)\s+(?:a\s+)?(new\s+)?(song|music|beat|track)/i,
      // Studio access
      /(?:open|go\s+to|access)\s+(?:the\s+)?(ai|music|song)?\s*(studio|creator|maker)/i,
      // Short forms
      /^(studio|create|make|compose|produce|ai\s*studio)$/i,
      // Edge cases
      /(?:i\s+want\s+to\s+)?make\s+some\s+music/i,
      /(?:can\s+i\s+)?(try|use)\s+the\s+music\s+maker/i
    ],
    message: 'Opening AI Studio to create music',
    synonyms: ['ai studio', 'music studio', 'create song', 'make music', 'compose', 'produce', 'song creator']
  },
  'productions/album': {
    patterns: [
      // Direct access
      /^(?:show\s+me|open|go\s+to)\s+(?:my\s+)?(songs?|music|album|tracks?|library)/i,
      // Playback requests
      /(?:play|listen\s+to)\s+(?:my\s+)?(songs?|tracks?|music|album)/i,
      // Questions
      /(?:where\s+are\s+my\s+|can\s+i\s+see\s+my\s+)(songs?|music|tracks?|album)/i,
      // Collection access
      /(?:i\s+want\s+to\s+)?(see|check|browse)\s+(?:my\s+)?(songs?|music|tracks?|album)/i,
      // Short forms
      /^(my\s+)?(songs?|music|album|tracks?|library)$/i,
      // Edge cases
      /(?:show\s+me\s+what\s+i'?ve\s+created|my\s+creations)/i
    ],
    message: 'Opening your music library',
    synonyms: ['my songs', 'my music', 'my album', 'my tracks', 'music library', 'song collection']
  },
  productions: {
    patterns: [
      // Direct commands
      /^(?:let'?s?\s+)?(listen\s+to|play|open|go\s+to|navigate\s+to)\s+(?:the\s+)?(radio|ai\s*radio|station)/i,
      // Questions
      /(?:can\s+you\s+)?(?:please\s+)?(play|turn\s+on|start)\s+(?:the\s+)?(radio|ai\s*radio|station)/i,
      // Music streaming
      /(?:i\s+want\s+to\s+)?(listen\s+to|hear)\s+(?:some\s+)?(radio|music|ai\s*radio)/i,
      // Short forms
      /^(radio|ai\s*radio|station|listen|music)$/i,
      // Edge cases
      /(?:play\s+me\s+some\s+)?background\s+music/i,
      /(?:i\s+want\s+to\s+)?hear\s+something\s+new/i
    ],
    message: 'Tuning into the radio station',
    synonyms: ['radio', 'ai radio', 'radio station', 'listen to radio', 'music station']
  },
  'video-player': {
    patterns: [
      // Direct commands
      /^(?:let'?s?\s+)?(watch|view|see|open|go\s+to|navigate\s+to)\s+(?:my\s+)?(videos?|gallery|video\s*player)/i,
      // Questions
      /(?:can\s+you\s+)?(?:please\s+)?(show|open)\s+(?:my\s+)?(videos?|gallery)/i,
      // Browsing
      /(?:i\s+want\s+to\s+)?(watch|see|browse)\s+(?:my\s+)?(videos?|gallery)/i,
      // Short forms
      /^(videos?|gallery|video\s*player|watch)$/i,
      // Edge cases
      /(?:show\s+me\s+)?my\s+recorded\s+videos?/i,
      /(?:i\s+want\s+to\s+)?see\s+what\s+i'?ve\s+recorded/i
    ],
    message: 'Opening video player',
    synonyms: ['videos', 'gallery', 'video player', 'my videos', 'watch videos']
  },
  home: {
    patterns: [
      // Direct commands
      /^(?:go\s+back\s+to|return\s+to|go\s+to|navigate\s+to|take\s+me\s+to|show\s+me\s+)?(?:the\s+)?(home|main\s+page|start|main\s+menu)/i,
      // Questions
      /(?:can\s+you\s+)?(?:please\s+)?(go\s+back|return|go\s+home)/i,
      // Navigation
      /(?:i\s+want\s+to\s+)?(go\s+back|return|go\s+home|start\s+over)/i,
      // Short forms
      /^(home|main|start|menu)$/i,
      // Edge cases
      /(?:take\s+me\s+)?back\s+to\s+(?:the\s+)?(beginning|start)/i,
      /(?:i'?m\s+done|i'?m\s+finished)(?:\s+here)?/i
    ],
    message: 'Going to the home page',
    synonyms: ['home', 'main page', 'homepage', 'go home', 'start', 'main menu', 'go back']
  },
  about: {
    patterns: [
      // Direct questions
      /^(?:can\s+you\s+)?(?:please\s+)?(tell\s+me\s+)?(about|who\s+are\s+you|what\s+is\s+this)/i,
      // Information requests
      /(?:i\s+want\s+to\s+)?(know|learn)\s+(?:more\s+)?(about\s+you|about\s+this\s+app)/i,
      // Help
      /(?:how\s+does\s+this\s+work|what\s+can\s+i\s+do\s+here)/i,
      // Short forms
      /^(about|info|help|what is this)$/i,
      // Edge cases
      /(?:tell\s+me\s+)?more\s+about\s+(?:you|this\s+app)/i,
      /(?:what'?s\s+this\s+all\s+about|who\s+made\s+you)/i
    ],
    message: 'Showing information about us',
    synonyms: ['about', 'about us', 'information', 'who are you', 'help', 'info']
  },
  contact: {
    patterns: [
      // Direct requests
      /^(?:i\s+need\s+)?(?:to\s+)?(contact|reach\s+out|get\s+in\s+touch|support|help|talk\s+to\s+someone)/i,
      // Questions
      /(?:how\s+can\s+i\s+)?(contact|reach|get\s+help)/i,
      // Support
      /(?:i\s+need\s+)?(help|support|assistance)/i,
      // Short forms
      /^(contact|help|support)$/i,
      // Edge cases
      /(?:i\s+have\s+a\s+question|i\s+need\s+to\s+talk\s+to\s+someone)/i,
      /(?:can\s+you\s+help\s+me|i\s+need\s+assistance)/i
    ],
    message: 'Taking you to our contact page',
    synonyms: ['contact', 'reach out', 'get in touch', 'contact us', 'support', 'help', 'customer service']
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