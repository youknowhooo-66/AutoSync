import { eventBus } from '@/core/events/eventBus';

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data: any;
  timestamp: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('@AutoSync:offlineQueue');
      if (stored) this.queue = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load offline queue');
    }
  }

  private saveToStorage() {
    localStorage.setItem('@AutoSync:offlineQueue', JSON.stringify(this.queue));
  }

  public enqueue(url: string, method: string, data: any) {
    this.queue.push({
      id: crypto.randomUUID(),
      url,
      method,
      data,
      timestamp: Date.now()
    });
    this.saveToStorage();
    console.log(`[OfflineQueue] Request queued. Total: ${this.queue.length}`);
  }

  private handleOnline = async () => {
    this.isOnline = true;
    console.log('[OfflineQueue] System is online. Processing queue...');
    
    // In a real scenario, we would pop and send requests sequentially to API here.
    // For now, we just clear the queue.
    this.queue = [];
    this.saveToStorage();
  };

  private handleOffline = () => {
    this.isOnline = false;
    console.warn('[OfflineQueue] System is offline. Requests will be queued.');
  };
}

export const offlineQueue = new OfflineQueue();
