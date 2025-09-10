import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { SYSTEM_INSTRUCTIONS } from '@/utils/voiceAssistant/prompts';

const prisma = new PrismaClient();

// Constants for credit calculation
const CHAT_CREDITS_PER_MESSAGE = 5; // Adjust this value as needed

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req) {
  try {
    // Get user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { messages } = await req.json();
    
    // Get user with message count
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

    // Calculate message count and credits to deduct
    const messageCount = messages.length;
    const creditsToDeduct = Math.floor(messageCount / 10) * 40;
    
    // Check if user has enough credits
    if (user.credits < creditsToDeduct) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits to continue.' }, 
        { status: 402 }
      );
    }

    // Deduct credits if needed
    if (creditsToDeduct > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          credits: { decrement: creditsToDeduct } 
        }
      });
    }

    // Generate the chat response
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages,
      system: SYSTEM_INSTRUCTIONS,
    });

	console.log('Chat response:', result);

    // Return the streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
