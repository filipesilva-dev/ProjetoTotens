import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';
import { ENV } from '@/config/env';
import { getAccessToken, setAccessToken } from './session';

let refreshing: Promise<string> | undefined;
export async function refreshSession(): Promise<string> {
  refreshing ??= axios.post<{ accessToken: string }>(`${ENV.apiUrl}/auth/refresh`, {}, { withCredentials: true })
    .then(({ data }) => { setAccessToken(data.accessToken); return data.accessToken; })
    .finally(() => { refreshing = undefined; });
  return refreshing;
}

export const api: AxiosInstance = axios.create({
  baseURL: ENV.apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ detail?: string }>) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail ?? error.message ?? 'Erro inesperado';
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (status === 401 && original && !original._retried && !original.url?.startsWith('/auth/')) {
      original._retried = true;
      try {
        original.headers.Authorization = `Bearer ${await refreshSession()}`;
        return api(original);
      } catch { setAccessToken(undefined); }
    }
    return Promise.reject({ detail, status } as ApiError);
  },
);
