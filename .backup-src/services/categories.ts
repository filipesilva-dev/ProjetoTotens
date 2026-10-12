import { api } from './api';
import type { Category } from '@/types';
import { MOCK_CATEGORIES } from '@/mock/menu';
import { ENV } from '@/config/env';
export const categoriesService = {
  async list(): Promise<Category[]> {
    if (ENV.useMocks) { await new Promise((r) => setTimeout(r, 120)); return MOCK_CATEGORIES; }
    const { data } = await api.get<Category[]>('/categories');
    return data;
  },
};
