import { SYSTEM_INSTRUCTIONS } from '@/utils/voiceAssistant/prompts';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is missing' }, { status: 500 });
    }

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'verse',
        instructions: SYSTEM_INSTRUCTIONS,
        tools: [
          {
            type: 'function',
            name: 'create_song',
            description: 'Generates a new song based on user input',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Title of the song' },
                prompt: { type: 'string', description: 'Prompt or theme for the song' }
              },
              required: ['title', 'prompt']
            }
          },
          {
            type: 'function',
            name: 'navigate_to',
            description: 'Navigate to a specific page',
            parameters: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to navigate to' }
              },
              required: ['url']
            }
          }
        ]
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: 'Failed to create session', details: errorText }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({ client_secret: data.client_secret.value });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
