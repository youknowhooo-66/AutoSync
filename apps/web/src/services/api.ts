import axios from 'axios';
import { useAuthStore } from '../modules/auth/state/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000, // 30 seconds timeout
});

// Auto-inject headers
api.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  const token = state.token;
  const tenantId = state.user?.tenantId;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId && config.headers) {
    // Inject both case variants for maximum backend compatibility
    config.headers['X-Tenant-Id'] = tenantId;
    config.headers['x-tenant-id'] = tenantId;
  }

  return config;
});

// Handle unauthorized responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear session only if we are not already on the login page to avoid loops
      if (window.location.pathname !== '/login') {
        useAuthStore.getState().clearSession();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;
