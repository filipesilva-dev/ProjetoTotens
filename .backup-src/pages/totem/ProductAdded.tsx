import { useNavigate } from 'react-router-dom';
import { Button, IconCheck, Text } from '@/components/ui';
import { ProductCard } from '@/components/totem/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useCartStore } from '@/contexts/CartContext';
export default function ProductAdded() {
  const nav = useNavigate();
  const add = useCartStore((s) => s.add);
  const { products } = useProducts();
  const suggestions = products.filter((p) => p.available).slice(0, 3);
  return (
    <div className="screen" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 90, height: 90, borderRadius: '50%',
          background: 'var(--color-success-soft)', color: 'var(--color-success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconCheck size={50} />
        </div>
        <Text as="h1" size="3xl" weight="black">Produto inserido ao carrinho</Text>
        <Text size="lg" tone="muted">Gostaria de incluir também?</Text>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)' }}>
        {suggestions.map((p) => <ProductCard key={p.id} product={p} onSelect={() => add(p)} />)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)' }}>
        <Button variant="ghost" size="lg" onClick={() => nav('/menu')}>Voltar ao cardápio</Button>
        <Button size="lg" onClick={() => nav('/cart')}>Ver carrinho</Button>
      </div>
    </div>
  );
}
