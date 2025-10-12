require('dotenv').config({ path: '.env.local' });

const { createServer } = require('http');
const { parse } = require('url');
const { WebSocketServer } = require('ws');
const next = require('next');
const { OpenAI } = require('openai');

// Verify OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set in .env.local');
  process.exit(1);
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store active WebSocket connections
const clients = new Set();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Handle Next.js requests
    handle(req, res);
  });

  // Create WebSocket server
  const wss = new WebSocketServer({ noServer: true });

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

  // Handle WebSocket upgrade requests
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url);

    if (pathname === '/api/speech/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
