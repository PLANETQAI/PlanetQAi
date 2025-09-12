class QueueManager {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  addToQueue(item) {
    return new Promise((resolve) => {
      this.queue.push({ item, resolve });
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    console.log('[Queue] processQueue called, queue length:', this.queue.length);
    
    if (this.queue.length === 0) {
      console.log('[Queue] Queue is empty, stopping processing');
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { item, resolve } = this.queue[0];
    
    try {
      console.log('[Queue] Processing queue item...');
      const result = await item();
      console.log('[Queue] Queue item processed successfully, result:', result);
      resolve(result);
    } catch (error) {
      console.error('[Queue] Error processing queue item:', error);
      resolve(null); // Resolve with null to continue processing next items
    }

    // Remove the processed item and process next
    this.queue.shift();
    console.log('[Queue] Queue item removed, remaining items:', this.queue.length);
    
    // Process next item after a small delay
    const delay = 1000;
    console.log(`[Queue] Waiting ${delay}ms before processing next item...`);
    setTimeout(() => {
      console.log('[Queue] Processing next item in queue...');
      this.processQueue();
    }, delay);
  }
}

export const songGenerationQueue = new QueueManager();
