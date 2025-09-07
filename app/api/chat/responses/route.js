import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Proxy endpoint for the OpenAI Responses API
export async function POST(req) {
  const body = await req.json();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if (body.text?.format?.type === 'json_schema') {
    return await structuredResponse(openai, body);
  } else {
    return await textResponse(openai, body);
  }
}

async function structuredResponse(openai, body) {
  try {
    const response = await openai.responses.parse({
      ...(body),
      stream: false,
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error('responses proxy error', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 }); 
  }
}

async function textResponse(openai, body) {
  try {
    const response = await openai.responses.create({
      ...(body),
      stream: false,
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error('responses proxy error', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
  