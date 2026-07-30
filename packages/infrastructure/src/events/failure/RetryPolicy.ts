export class RetryPolicy {
  constructor(
    private readonly maxRetries: number = 3,
    private readonly initialBackoffMs: number = 1000,
  ) {}

  shouldRetry(currentRetries: number): boolean {
    return currentRetries < this.maxRetries;
  }

  getBackoffMs(currentRetries: number): number {
    return this.initialBackoffMs * Math.pow(2, currentRetries);
  }
}
