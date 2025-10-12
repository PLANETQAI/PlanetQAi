// public/audio-processor.js
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 16000; // 1 second at 16kHz
    this.buffer = [];
    this.isRecording = true;
    
    this.port.onmessage = (event) => {
      if (event.data === 'stop') {
        this.isRecording = false;
        this.buffer = [];
      } else if (event.data === 'start') {
        this.isRecording = true;
        this.buffer = [];
      } else if (event.data === 'flush') {
        this.flushBuffer();
      }
    };
  }

  flushBuffer() {
    if (this.buffer.length > 0) {
      try {
        // Create a copy of the buffer data
        const audioData = new Float32Array(this.buffer);
        this.port.postMessage({
          type: 'audioData',
          audioData: audioData.buffer
        }, [audioData.buffer]); // Transfer ownership for better performance
        
        this.buffer = [];
      } catch (e) {
        console.error('Error flushing buffer:', e);
      }
    }
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!this.isRecording) {
      return true;
    }
    
    if (input && input[0]) {
      // Copy input to output (pass-through)
      for (let channel = 0; channel < output.length; channel++) {
        const inputChannel = input[channel] || input[0];
        const outputChannel = output[channel] || [];
        
        for (let i = 0; i < outputChannel.length; i++) {
          outputChannel[i] = inputChannel[i] || 0;
        }
      }
      
      // Collect audio data in buffer
      const inputChannel = input[0];
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer.push(inputChannel[i]);
      }
      
      // When buffer reaches desired size, send it
      if (this.buffer.length >= this.bufferSize) {
        this.flushBuffer();
      }
    }
    
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);