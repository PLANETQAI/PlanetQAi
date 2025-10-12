class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.bufferSize = 16000; // 1 second buffer at 16kHz
    this.lastProcessTime = 0;
    this.port.onmessage = (event) => {
      if (event.data === 'stop') {
        this.stopProcessing();
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const currentTime = Date.now();
      
      // Add new audio data to buffer
      for (let i = 0; i < input[0].length; i++) {
        this.buffer.push(input[0][i]);
      }

      // Process audio every 1000ms (1 second)
      if (currentTime - this.lastProcessTime >= 1000 && this.buffer.length >= 16000) {
        this.lastProcessTime = currentTime;
        
        // Create a copy of the buffer and clear it
        const audioData = new Float32Array(this.buffer);
        this.buffer = [];
        
        // Send audio data to main thread
        this.port.postMessage({
          type: 'audioData',
          audioData: audioData.buffer
        }, [audioData.buffer]);
      }
    }
    return true;
  }

  stopProcessing() {
    this.buffer = [];
  }
}

registerProcessor('audio-processor', AudioProcessor);
