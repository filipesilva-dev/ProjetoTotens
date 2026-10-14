import { api, refreshSession } from './api';
import { useAuthStore } from '@/contexts/AuthContext';
import { useSuperAdminStore } from '@/contexts/SuperAdminContext';
import type { User } from '@/types';

interface LoginResult { accessToken: string; user: User; }

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post<LoginResult>('/auth/login', { email, password });
    if (data.user.role === 'superadmin') {
      useAuthStore.setState({ user: undefined, token: undefined });
      useSuperAdminStore.getState().login(data.user as User & { role: 'superadmin' }, data.accessToken);
    } else {
      useSuperAdminStore.setState({ user: undefined, token: undefined });
      useAuthStore.getState().login(data.user, data.accessToken);
    }
    return data.user;
  },
  async restore() {
    const accessToken = await refreshSession();
    const { data } = await api.get<User>('/auth/me');
    if (data.role === 'superadmin') {
      useAuthStore.setState({ user: undefined, token: undefined });
      useSuperAdminStore.getState().login(data as User & { role: 'superadmin' }, accessToken);
    } else {
      useSuperAdminStore.setState({ user: undefined, token: undefined });
      useAuthStore.getState().login(data, accessToken);
    }
    return data;
  },
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  signup: (payload: Record<string, unknown>) => api.post('/tenants', payload),
};
