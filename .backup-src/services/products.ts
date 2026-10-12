import { api } from './api';
import type { Product } from '@/types';
import { MOCK_PRODUCTS } from '@/mock/menu';
import { ENV } from '@/config/env';
export const productsService = {
  async list(): Promise<Product[]> {
    if (ENV.useMocks) { await new Promise((r) => setTimeout(r, 150)); return MOCK_PRODUCTS; }
    const { data } = await api.get<Product[]>('/products');
    return data;
  },
  async byId(id: string): Promise<Product> {
    if (ENV.useMocks) {
      const p = MOCK_PRODUCTS.find((x) => x.id === id);
      if (!p) throw { detail: 'Produto não encontrado', status: 404 };
      return p;
    }
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },
};
