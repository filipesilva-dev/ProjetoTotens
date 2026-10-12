import axios, { AxiosError, type AxiosInstance } from 'axios';
import type { ApiError } from '@/types';
import { ENV } from '@/config/env';
export const api: AxiosInstance = axios.create({
  baseURL: ENV.apiUrl, timeout: 15000, headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fastlanches.token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ detail?: string }>) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail ?? error.message ?? 'Erro inesperado';
    if (status === 401 && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('fastlanches.token');
      window.location.href = '/admin/login';
    }
    return Promise.reject({ detail, status } as ApiError);
  },
);
