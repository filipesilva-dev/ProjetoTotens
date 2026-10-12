import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SuperAdminUser { id: string; name: string; email: string; role: 'superadmin'; }
interface SuperAdminState {
  user?: SuperAdminUser; token?: string;
  isAuthenticated: () => boolean;
  login: (u: SuperAdminUser, t: string) => void;
  logout: () => void;
}
export const useSuperAdminStore = create<SuperAdminState>()(
  persist(
    (set, get) => ({
      isAuthenticated: () => Boolean(get().token),
      login: (user, token) => { localStorage.setItem('fastlanches.superadmin', token); set({ user, token }); },
      logout: () => { localStorage.removeItem('fastlanches.superadmin'); set({ user: undefined, token: undefined }); },
    }),
    { name: 'fastlanches.superauth' },
  ),
);
