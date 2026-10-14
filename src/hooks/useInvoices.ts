import { useEffect, useState } from 'react';
import type { Invoice } from '@/types';
import { invoicesService } from '@/services/invoices';

export function useInvoices() {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    invoicesService.list()
      .then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e) => { if (alive) setError(e?.detail ?? 'Erro ao carregar'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return { invoices: data, loading, error };
}
