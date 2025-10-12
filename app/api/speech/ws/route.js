import { WebSocketServer } from 'ws';
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Create a WebSocket server instance
const wss = new WebSocketServer({ noServer: true });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store active connections
const clients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  clients.add(ws);
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'audio' && data.audio) {
        try {
          const audioBuffer = Buffer.from(data.audio.split(',')[1], 'base64');
          
          const transcription = await openai.audio.transcriptions.create({
            file: new Blob([audioBuffer], { type: 'audio/webm' }),
            model: 'whisper-1',
          });
          
          ws.send(JSON.stringify({
            type: 'transcription',
            text: transcription.text,
          }));
        } catch (error) {
          console.error('Transcription error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to transcribe audio',
          }));
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (request.headers.get('upgrade') !== 'websocket') {
    return new NextResponse('Expected WebSocket request', { status: 426 });
  }

  const { next } = request;
  const { socket, response } = await next();

  if (!socket) {
    return new NextResponse('Could not create WebSocket connection', { status: 400 });
  }

  wss.handleUpgrade(request, socket, Buffer.alloc(0), (ws) => {
    wss.emit('connection', ws, request);
  });

  return response;
}
