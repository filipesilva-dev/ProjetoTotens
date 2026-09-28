import type { CartItem } from '@/types';
import { QuantitySelector, Text } from '@/components/ui';
import { formatBRL } from '@/utils/currency';
import './CartItemRow.css';
export interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (id: string, q: number) => void;
  onRemove: (item: CartItem) => void;
}
export function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  return (
    <div className="citem">
      <div className="citem__img"><img src={item.product.imageUrl} alt="" /></div>
      <div className="citem__info">
        <Text weight="bold" size="lg">{item.product.name}</Text>
        <Text tone="muted" size="sm">
          {item.quantity}x{item.removedIngredients.length > 0 && ` · sem ${item.removedIngredients.join(', ')}`}
        </Text>
        <Text tone="primary" weight="black" size="lg">{formatBRL(item.unitPrice * item.quantity)}</Text>
      </div>
      <div className="citem__actions">
        <QuantitySelector value={item.quantity} onChange={(q) => onQuantityChange(item.productId, q)} />
        <button type="button" className="citem__remove" onClick={() => onRemove(item)}>Remover</button>
      </div>
    </div>
  );
}
