import { SYSTEM_INSTRUCTIONS } from '@/utils/voiceAssistant/prompts';
import { NextResponse } from 'next/server';
import { tools } from '@/utils/voiceAssistant/tools';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Constants for credit calculation
const AUDIO_SESSION_CREDITS = 20; // Deduct 20 credits per audio session

export async function GET() {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get user with credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        credits: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough credits
    if (user.credits < AUDIO_SESSION_CREDITS) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits to use voice features.' }, 
        { status: 402 }
      );
    }

    // Deduct credits for the session
    await prisma.user.update({
      where: { id: userId },
      data: { 
        credits: { decrement: AUDIO_SESSION_CREDITS } 
      }
    });

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
        voice: 'shimmer',
        instructions: SYSTEM_INSTRUCTIONS,
        tools,
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
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
