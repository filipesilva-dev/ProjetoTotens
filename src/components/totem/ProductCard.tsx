import type { Product } from '@/types';
import { Text } from '@/components/ui';
import { formatBRL } from '@/utils/currency';
import './ProductCard.css';
export interface ProductCardProps { product: Product; onSelect: (p: Product) => void; }
export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button type="button" className="pcard" onClick={() => onSelect(product)}
      disabled={!product.available} aria-label={`${product.name}, ${formatBRL(product.price)}`}>
      <div className="pcard__img">
        <img src={product.imageUrl} alt="" loading="lazy" />
        {!product.available && <span className="pcard__unavail">Indisponível</span>}
      </div>
      <div className="pcard__body">
        <Text weight="bold" size="lg" className="pcard__name">{product.name}</Text>
        <Text tone="muted" size="sm" className="pcard__desc">{product.description}</Text>
        <div className="pcard__footer">
          <Text tone="primary" weight="black" size="xl">{formatBRL(product.price)}</Text>
          <span className="pcard__plus" aria-hidden>+</span>
        </div>
      </div>
    </button>
  );
}
