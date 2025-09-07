import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Creating new session...');
  console.log('OPENAI_API_KEY', process.env.OPENAI_API_KEY);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    return NextResponse.json(
      { error: "Server configuration error: OPENAI_API_KEY is not set" },
      { status: 500 }
    );
  }


  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: 'verse',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.log('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      return NextResponse.json(
        { 
          error: "Failed to create session",
          details: error,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Session created successfully', data);
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
