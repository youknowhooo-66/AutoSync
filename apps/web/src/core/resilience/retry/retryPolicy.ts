export const RETRY_POLICIES = {
  // Retry 3 times with exponential backoff (1s, 2s, 4s)
  NETWORK_ERROR: {
    attempts: 3,
    backoff: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
    shouldRetry: (error: any) => !error.response || error.code === 'ECONNABORTED'
  },
  // Retry once for server errors (500)
  SERVER_ERROR: {
    attempts: 1,
    backoff: () => 2000,
    shouldRetry: (error: any) => error.response?.status >= 500
  },
  // Never retry for user errors (4xx)
  CLIENT_ERROR: {
    attempts: 0,
    backoff: () => 0,
    shouldRetry: () => false
  }
};

export function determineRetryPolicy(failureCount: number, error: any): boolean {
  let policy = RETRY_POLICIES.CLIENT_ERROR;

  if (RETRY_POLICIES.NETWORK_ERROR.shouldRetry(error)) {
    policy = RETRY_POLICIES.NETWORK_ERROR;
  } else if (RETRY_POLICIES.SERVER_ERROR.shouldRetry(error)) {
    policy = RETRY_POLICIES.SERVER_ERROR;
  }

  return failureCount < policy.attempts;
}

export function getRetryDelay(failureCount: number, error: any): number {
  if (RETRY_POLICIES.NETWORK_ERROR.shouldRetry(error)) {
    return RETRY_POLICIES.NETWORK_ERROR.backoff(failureCount);
  }
  return 1000;
}
