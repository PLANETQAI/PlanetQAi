// app/api/test-webhook/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  
  return NextResponse.json({
    success: true,
    path: url.pathname,
    hasTrailingSlash: url.pathname.endsWith('/'),
    headers: {
      'content-type': headers['content-type'],
      'content-length': headers['content-length'],
      'user-agent': headers['user-agent'],
    }
  });
}

// Allow both GET and POST for testing
export async function GET(request) {
  return POST(request);
}