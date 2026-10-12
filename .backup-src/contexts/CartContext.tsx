import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, Addition } from '@/types';

interface AddOptions { quantity?: number; removedIngredients?: string[]; additions?: Addition[]; notes?: string; }
interface CartState {
  items: CartItem[]; cpf?: string; email?: string; wantsInvoiceEmail: boolean;
  add: (p: Product, opts?: AddOptions) => void;
  updateQuantity: (id: string, q: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  setCpf: (c?: string) => void;
  setEmail: (e?: string) => void;
  setWantsInvoiceEmail: (v: boolean) => void;
  subtotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [], wantsInvoiceEmail: false,

      add: (product, opts = {}) => {
        const quantity = opts.quantity ?? 1;
        const removed = opts.removedIngredients ?? [];
        const additions = opts.additions ?? [];
        const notes = (opts.notes ?? '').trim();

        // Duas linhas só se fundem se produto + removidos + adicionais + notas forem idênticos.
        // Isso evita que pedidos com observações diferentes virem um só.
        const idx = get().items.findIndex((i) =>
          i.productId === product.id &&
          JSON.stringify(i.removedIngredients) === JSON.stringify(removed) &&
          JSON.stringify(i.additions) === JSON.stringify(additions) &&
          (i.notes ?? '') === notes
        );

        if (idx >= 0) {
          const items = [...get().items];
          items[idx] = { ...items[idx]!, quantity: items[idx]!.quantity + quantity };
          set({ items });
          return;
        }

        const extras = additions.reduce((s, a) => s + a.price, 0);
        set({
          items: [
            ...get().items,
            {
              productId: product.id,
              product,
              quantity,
              removedIngredients: removed,
              additions,
              notes: notes || undefined,
              unitPrice: product.price + extras,
            },
          ],
        });
      },

      updateQuantity: (id, q) => set({ items: get().items.map((i) =>
        i.productId === id ? { ...i, quantity: Math.max(1, q) } : i) }),
      remove: (id) => set({ items: get().items.filter((i) => i.productId !== id) }),
      clear: () => set({ items: [], cpf: undefined, email: undefined, wantsInvoiceEmail: false }),
      setCpf: (cpf) => set({ cpf }),
      setEmail: (email) => set({ email }),
      setWantsInvoiceEmail: (wantsInvoiceEmail) => set({ wantsInvoiceEmail }),
      subtotal: () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'fastlanches.cart', version: 1 },
  ),
);
