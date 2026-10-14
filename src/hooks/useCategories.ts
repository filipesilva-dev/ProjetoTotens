import { useEffect, useState } from 'react';
import type { Category } from '@/types';
import { categoriesService } from '@/services/categories';
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    categoriesService.list()
      .then((d) => { if (alive) { setCategories(d); setError(null); } })
      .catch((e) => { if (alive) setError(e?.detail ?? 'Erro'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  return { categories, loading, error };
}
