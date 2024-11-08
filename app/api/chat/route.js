import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextResponse } from 'next/server'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req) {
	try {
		const { messages } = await req.json()

		const result = await streamText({
			model: openai('gpt-3.5-turbo'),
			messages,
			system: 'You are being aked to generate lyrics.',
			experimental_providerMetadata: { openai: { maxCompletionTokens: 1000 } },
		})

		return result.toDataStreamResponse()
	} catch (error) {
		console.log('Something went wrong', error)
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
	}
}
