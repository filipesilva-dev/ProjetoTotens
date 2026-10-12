import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, IconBack, QuantitySelector, Spinner, Text } from '@/components/ui';
import { AllergenBadge } from '@/components/totem/AllergenBadge';
import { productsService } from '@/services/products';
import { useCartStore } from '@/contexts/CartContext';
import { formatBRL } from '@/utils/currency';
import type { Product } from '@/types';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const add = useCartStore((s) => s.add);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [removed, setRemoved] = useState<string[]>([]);
  const [additions, setAdditions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productsService.byId(id).then(setProduct).catch(() => setProduct(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="screen screen--center"><Spinner size={64} /></div>;
  if (!product) return <div className="screen screen--center"><Text>Produto não encontrado</Text></div>;

  const extras = product.additions?.filter((a) => additions.includes(a.id)).reduce((s, a) => s + a.price, 0) ?? 0;
  const total = (product.price + extras) * quantity;

  const toggle = (arr: string[], set: (v: string[]) => void, value: string) =>
    set(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);

  const handleAdd = () => {
    add(product, {
      quantity,
      removedIngredients: removed,
      additions: product.additions?.filter((a) => additions.includes(a.id)) ?? [],
      notes: notes.trim() || undefined,
    });
    nav('/product-added');
  };

  return (
    <div className="pd">
      {/* Hero em coluna única: imagem ocupa quase toda a largura inicial */}
      <div className="pd__hero">
        <img src={product.imageUrl} alt={product.name} />
        <button className="pd__back" onClick={() => nav('/menu')} aria-label="Voltar">
          <IconBack size={26} />
        </button>
        <div className="pd__hero-overlay">
          <Text as="h2" size="3xl" weight="black" tone="inverse">{product.name}</Text>
        </div>
      </div>

      <div className="pd__body">
        <main className="pd__main">
          <div className="pd__title-row">
            <Text as="h3" size="2xl" weight="black">{product.name}</Text>
            <Text size="3xl" weight="black" tone="primary">{formatBRL(product.price)}</Text>
          </div>

          <section className="pd__section">
            <Text weight="black" size="lg">Descrição</Text>
            <Text tone="muted">{product.description}</Text>
          </section>

          {product.ingredients && product.ingredients.length > 0 && (
            <section className="pd__section">
              <Text weight="black" size="lg">Ingredientes</Text>
              <Text tone="soft" size="sm">Toque para remover o que não quiser</Text>
              <div className="pd__checks">
                {product.ingredients.map((ing) => {
                  const isRemoved = removed.includes(ing);
                  return (
                    <label key={ing} className={`pd__check ${isRemoved ? 'pd__check--off' : ''}`}>
                      <input
                        type="checkbox"
                        checked={!isRemoved}
                        onChange={() => toggle(removed, setRemoved, ing)}
                      />
                      <span>{ing}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          {product.additions && product.additions.length > 0 && (
            <section className="pd__section">
              <Text weight="black" size="lg">Adicionais</Text>
              <Text tone="soft" size="sm">Toque para incluir no pedido</Text>
              <div className="pd__checks">
                {product.additions.map((a) => (
                  <label key={a.id} className="pd__check">
                    <input
                      type="checkbox"
                      checked={additions.includes(a.id)}
                      onChange={() => toggle(additions, setAdditions, a.id)}
                    />
                    <span style={{ flex: 1 }}>{a.name}</span>
                    <Text tone="primary" weight="bold">+ {formatBRL(a.price)}</Text>
                  </label>
                ))}
              </div>
            </section>
          )}

          <section className="pd__section">
            <Text weight="black" size="lg">Observações</Text>
            <Text tone="soft" size="sm">Algum detalhe para a cozinha?</Text>
            <div className="pd__notes-wrap">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: ponto da carne, molho à parte, sem sal..."
                maxLength={200}
                rows={3}
                className="pd__notes"
              />
              <span className="pd__notes-counter">{notes.length}/200</span>
            </div>
          </section>
        </main>

        <aside className="pd__side">
          <Text weight="black" size="lg">Alergênicos</Text>
          {product.allergens && product.allergens.length > 0 ? (
            <>
              <Text tone="muted" size="sm">Este produto contém:</Text>
              <div className="pd__allergen-list" role="list">
                {product.allergens.map((a) => <AllergenBadge key={a} allergen={a} />)}
              </div>
            </>
          ) : (
            <div className="pd__allergen-empty">
              <Text tone="soft" size="sm">Sem alergênicos declarados</Text>
            </div>
          )}
        </aside>
      </div>

      <div className="pd__footer">
        <QuantitySelector value={quantity} size="lg" onChange={setQuantity} />
        <Button size="xl" onClick={handleAdd} style={{ flex: 1 }}>
          Adicionar · {formatBRL(total)}
        </Button>
      </div>
    </div>
  );
}
