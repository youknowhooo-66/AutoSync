import axios from 'axios';
import { useAuthStore } from '../modules/auth/state/auth.store';

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
});

// Auto-inject headers (auth token, tenant/company, branch)
api.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  const token = state.token;
  const tenantId = state.user?.tenantId;

  // Read branchId directly from localStorage since Axios interceptor runs outside React context lifecycle
  const branchId = localStorage.getItem('@AutoSync:branchId');

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId && config.headers) {
    // Inject official company header matching the backend's preference
    config.headers['x-company-id'] = tenantId;
  }

  if (branchId && config.headers) {
    config.headers['x-branch-id'] = branchId;
  }

  return config;
});

// Handle unauthorized responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized: Clear session and redirect to login (preventing loops)
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login') {
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
