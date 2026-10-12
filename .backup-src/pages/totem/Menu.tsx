import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner, Text } from '@/components/ui';
import { ProductCard } from '@/components/totem/ProductCard';
import { Sidebar } from '@/components/totem/Sidebar';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useCartStore } from '@/contexts/CartContext';
import { formatBRL } from '@/utils/currency';
import './Menu.css';
export default function Menu() {
  const nav = useNavigate();
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const subtotal = useCartStore((s) => s.subtotal());
  const filtered = activeCat ? products.filter((p) => p.categoryId === activeCat) : products;
  return (
    <div className="menu">
      <Sidebar categories={categories} activeId={activeCat} onSelect={setActiveCat} />
      <div className="menu__content">
        <div className="menu__head">
          <Text as="h2" size="2xl" weight="black">
            {activeCat ? categories.find((c) => c.id === activeCat)?.name : 'Cardápio'}
          </Text>
          <Text tone="muted" size="sm">{filtered.length} itens</Text>
        </div>
        {loading ? (
          <div className="menu__loading"><Spinner size={56} label="Carregando cardápio..." /></div>
        ) : (
          <div className="menu__grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onSelect={() => nav(`/product/${p.id}`)} />
            ))}
          </div>
        )}
        {subtotal > 0 && (
          <div className="menu__cart-bar">
            <Button size="lg" onClick={() => nav('/cart')} rightIcon={<span>→</span>}>
              Ver carrinho · {formatBRL(subtotal)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
