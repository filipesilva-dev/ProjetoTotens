import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
interface AuthState {
  user?: User; token?: string;
  isAuthenticated: () => boolean;
  login: (u: User, t: string) => void;
  logout: () => void;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: () => Boolean(get().token),
      login: (user, token) => { localStorage.setItem('fastlanches.token', token); set({ user, token }); },
      logout: () => { localStorage.removeItem('fastlanches.token'); set({ user: undefined, token: undefined }); },
    }),
    { name: 'fastlanches.auth' },
  ),
);
