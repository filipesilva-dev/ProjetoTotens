import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { productsService } from '@/services/products';
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    productsService.list()
      .then((data) => { if (alive) { setProducts(data); setError(null); } })
      .catch((e) => { if (alive) setError(e?.detail ?? 'Erro ao carregar produtos'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  return { products, loading, error };
}
