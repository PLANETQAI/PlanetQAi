import { WebSocketServer } from 'ws';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store active connections
const clients = new Set();

// Initialize WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Handle new WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  clients.add(ws);
  
  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'audio' && data.audio) {
        try {
          // Convert base64 audio to buffer
          const audioBuffer = Buffer.from(data.audio.split(',')[1], 'base64');
          
          // Transcribe with Whisper
          const transcription = await openai.audio.transcriptions.create({
            file: new Blob([audioBuffer], { type: 'audio/webm' }),
            model: 'whisper-1',
          });
          
          // Send transcription back to client
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
  
  // Handle connection close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clients.delete(ws);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

export default wss;
