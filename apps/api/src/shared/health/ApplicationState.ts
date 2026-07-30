/**
 * ApplicationState — centralized lifecycle state for the API process.
 *
 * Used by liveness/readiness endpoints and graceful shutdown to coordinate
 * the current phase of the application. This is the single source of truth
 * and must NOT be coupled to any business module.
 */

export type AppLifecycleState = 'starting' | 'ready' | 'shutting_down';

class ApplicationStateManager {
  private state: AppLifecycleState = 'starting';

  getState(): AppLifecycleState {
    return this.state;
  }

  isReady(): boolean {
    return this.state === 'ready';
  }

  isShuttingDown(): boolean {
    return this.state === 'shutting_down';
  }

  setReady(): void {
    this.state = 'ready';
  }

  setShuttingDown(): void {
    this.state = 'shutting_down';
  }
}

/**
 * Singleton instance. Import and use throughout the application.
 */
export const applicationState = new ApplicationStateManager();
