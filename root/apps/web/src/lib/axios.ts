import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
});

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

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@AutoSync:token');
      localStorage.removeItem('@AutoSync:user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
