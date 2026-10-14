import { api } from './api';
import type { Category } from '@/types';
export const categoriesService = {
  async list(): Promise<Category[]> {
    const { data } = await api.get<Category[]>('/categories');
    return data;
  },
  create: async (payload: Omit<Category, 'id'>) => (await api.post<Category>('/categories', payload)).data,
  update: async (id: string, payload: Omit<Category, 'id'>) => (await api.patch<Category>(`/categories/${id}`, payload)).data,
  remove: async (id: string) => { await api.delete(`/categories/${id}`); },
};
