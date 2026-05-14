import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Auto-inject token into all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@AutoSync:token');
  const companyId = localStorage.getItem('@AutoSync:companyId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (companyId) {
    config.headers['x-company-id'] = companyId;
  }

  return config;
});

// Handle unauthorized responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@AutoSync:token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
