import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Text } from '@/components/ui';
import { CartItemRow } from '@/components/totem/CartItemRow';
import { useCartStore } from '@/contexts/CartContext';
import { formatBRL } from '@/utils/currency';
import type { CartItem } from '@/types';
import './Cart.css';
export default function Cart() {
  const nav = useNavigate();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const remove = useCartStore((s) => s.remove);
  const subtotal = useCartStore((s) => s.subtotal());
  const [toRemove, setToRemove] = useState<CartItem | null>(null);
  if (items.length === 0) { nav('/cart-empty', { replace: true }); return null; }
  return (
    <div className="cart">
      <Text as="h1" size="3xl" weight="black">Seu carrinho</Text>
      <div className="cart__list">
        {items.map((i) => (
          <CartItemRow key={i.productId} item={i}
            onQuantityChange={updateQuantity} onRemove={setToRemove} />
        ))}
      </div>
      <div className="cart__totals">
        <div className="cart__line">
          <Text tone="muted">Subtotal</Text><Text>{formatBRL(subtotal)}</Text>
        </div>
        <div className="cart__line cart__line--total">
          <Text weight="black" size="xl">Total</Text>
          <Text weight="black" size="xl" tone="primary">{formatBRL(subtotal)}</Text>
        </div>
      </div>
      <div className="cart__footer">
        <Button variant="ghost" size="lg" onClick={() => nav('/menu')}>Continuar comprando</Button>
        <Button size="lg" onClick={() => nav('/identification')}>Finalizar pedido</Button>
      </div>
      <Modal open={Boolean(toRemove)} title="Remover item?"
        description="Tem certeza que deseja remover este item do carrinho?"
        confirmLabel="Remover" variant="danger"
        onConfirm={() => { if (toRemove) remove(toRemove.productId); setToRemove(null); }}
        onCancel={() => setToRemove(null)} />
    </div>
  );
}
