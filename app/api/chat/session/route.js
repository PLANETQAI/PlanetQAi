import { SYSTEM_INSTRUCTIONS } from '@/utils/voiceAssistant/prompts';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is missing' }, { status: 500 });
    }

    // Call OpenAI to create a realtime session
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17', // use correct model
        voice: 'verse',
        instructions: SYSTEM_INSTRUCTIONS 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: 'Failed to create session', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    // Only send the client_secret back to the browser
    return NextResponse.json({ client_secret: data.client_secret });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
