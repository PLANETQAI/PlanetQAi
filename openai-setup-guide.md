# OpenAI API Key Setup Guide for PlanetQAi Chat

## Environment Variables Setup

Add the following to your `.env.local` file:

```
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Organization ID if you're using one
# OPENAI_ORGANIZATION_ID=your_org_id
```

## Configuring the OpenAI Client

Update your `/app/api/chat/route.js` file to use the API key from environment variables:

```javascript
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextResponse } from 'next/server'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Route segment config for Next.js 14
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { messages } = await req.json()

    // Configure OpenAI with API key from environment variables
    const result = streamText({
      model: openai('gpt-4o-mini', {
        apiKey: process.env.OPENAI_API_KEY,
        // organization: process.env.OPENAI_ORGANIZATION_ID, // Optional
      }),
      messages,
      // system: 'You are being asked to generate lyrics.',
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

## Security Best Practices

1. **Never expose your API key in client-side code**
   - Always keep the API key on the server side
   - The current implementation correctly handles this by making API calls from the route handler

2. **Set up usage limits in your OpenAI dashboard**
   - Prevent unexpected charges by setting monthly spending limits

3. **Consider implementing rate limiting**
   - Add rate limiting to prevent abuse of your API endpoint

4. **Monitor usage**
   - Regularly check your OpenAI usage dashboard to track consumption

## Vercel Deployment

When deploying to Vercel:

1. Add the `OPENAI_API_KEY` to your Vercel environment variables in the project settings
2. Make sure to set it for all environments (Production, Preview, Development)
3. Redeploy your application after adding the environment variables

## Local Development

For local development:
1. Create a `.env.local` file if it doesn't exist
2. Add your OpenAI API key as shown above
3. Restart your development server
