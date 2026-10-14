import { api } from './api';
import type { Product } from '@/types';
export const productsService = {
  async list(): Promise<Product[]> {
    const { data } = await api.get<Product[]>('/products');
    return data.map(p => ({ ...p, price: Number(p.price), additions: (p.additions ?? []).map(a => ({ ...a, price: Number(a.price) })) }));
  },
  async byId(id: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${id}`);
    return { ...data, price: Number(data.price), additions: (data.additions ?? []).map(a => ({ ...a, price: Number(a.price) })) };
  },
  create: async (payload: Omit<Product, 'id'>) => (await api.post<Product>('/products', payload)).data,
  update: async (id: string, payload: Omit<Product, 'id'>) => (await api.put<Product>(`/products/${id}`, payload)).data,
  remove: async (id: string) => { await api.delete(`/products/${id}`); },
};
