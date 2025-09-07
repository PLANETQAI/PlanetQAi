import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextResponse } from 'next/server'
import { SYSTEM_INSTRUCTIONS } from '@/utils/voiceAssistant/prompts';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req) {
	try {
		const { messages } = await req.json()

		const result = streamText({
			model: openai('gpt-4o-mini'),
			messages,
			system: SYSTEM_INSTRUCTIONS,
		})

		return result.toDataStreamResponse()
	} catch (error) {
		console.log(error)
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
	}
}
