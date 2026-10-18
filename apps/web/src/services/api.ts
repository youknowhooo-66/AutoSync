import axios from 'axios';
import { useAuthStore } from '../modules/auth/state/auth.store';
import { logger } from '@/utils/logger';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // In development/test mode, fall back to local API if environment is not set
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    return 'http://localhost:3000/api';
  }

  // In production, force environment variable configuration to prevent silent failure
  throw new Error('[API Configuration] VITE_API_URL environment variable is missing in production!');
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 seconds timeout
  // Sends the httpOnly session cookie set by POST /auth/login.
  withCredentials: true,
});

// Auto-inject the selected branch. The tenant comes from the session on the server.
api.interceptors.request.use((config) => {
  // Read branchId directly from localStorage since Axios interceptor runs outside React context lifecycle
  const branchId = localStorage.getItem('@AutoSync:branchId');

  if (branchId && config.headers) {
    config.headers['x-branch-id'] = branchId;
  }

  logger.api.debug(`[Request] ${config.method?.toUpperCase()} ${config.url}`);

  return config;
});

// Handle unauthorized responses globally
api.interceptors.response.use(
  (response) => {
    logger.api.debug(`[Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const responseData = error.response?.data;
    const requestPayload = error.config?.data;
    let parsedPayload = null;
    try {
      if (requestPayload) {
        parsedPayload = typeof requestPayload === 'string' ? JSON.parse(requestPayload) : requestPayload;
      }
    } catch (_) {}

    logger.api.warn(
      `[Error Response] ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      {
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        requestData: parsedPayload,
        responseData: responseData,
      }
    );

    // 401 Unauthorized: Clear session and redirect to login (preventing loops)
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login') {
        logger.auth.warn('Session expired or unauthorized. Redirecting to login.');
        useAuthStore.getState().clearSession();
        window.location.href = '/login';
      }
    }
    // 403 Forbidden / Network errors: Let callers handle the rejection natively without clearing session
    return Promise.reject(error);
  }
);

export { api };
export default api;
