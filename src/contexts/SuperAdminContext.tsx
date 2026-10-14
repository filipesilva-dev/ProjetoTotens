import { create } from 'zustand';
import { setAccessToken } from '@/services/session';

interface SuperAdminUser { id: string; name: string; email: string; role: 'superadmin'; }
interface SuperAdminState {
  user?: SuperAdminUser; token?: string;
  isAuthenticated: () => boolean;
  login: (u: SuperAdminUser, t: string) => void;
  logout: () => void;
}
export const useSuperAdminStore = create<SuperAdminState>()(
    (set, get) => ({
      isAuthenticated: () => Boolean(get().token),
      login: (user, token) => { setAccessToken(token); set({ user, token }); },
      logout: () => {
        void fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
        setAccessToken(undefined);
        set({ user: undefined, token: undefined });
      },
    }),
);
