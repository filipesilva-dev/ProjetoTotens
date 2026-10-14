import { create } from 'zustand';
import type { User } from '@/types';
import { setAccessToken } from '@/services/session';

interface AuthState {
  user?: User; token?: string;
  isAuthenticated: () => boolean;
  login: (u: User, t: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    (set, get) => ({
      isAuthenticated: () => Boolean(get().token),
      login: (user, token) => {
        setAccessToken(token);
        set({ user, token });
      },
      logout: () => {
        void fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
        setAccessToken(undefined);
        set({ user: undefined, token: undefined });
      },
    }),
);
