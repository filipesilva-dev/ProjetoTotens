import { IconCart, IconMenu, Text } from '@/components/ui';
import { BRAND } from '@/config/brand';
import './TotemHeader.css';
export interface TotemHeaderProps {
  cartCount: number;
  onMenuClick: () => void;
  onCartClick: () => void;
}
export function TotemHeader({ cartCount, onMenuClick, onCartClick }: TotemHeaderProps) {
  return (
    <header className="thead">
      <button className="thead__icon" onClick={onMenuClick} aria-label="Menu"><IconMenu /></button>
      <div className="thead__brand">
        <span className="thead__logo">🍔</span>
        <Text as="h1" size="xl" weight="black" tone="primary">{BRAND.name}</Text>
      </div>
      <button className="thead__icon" onClick={onCartClick} aria-label="Carrinho">
        <IconCart />
        {cartCount > 0 && <span className="thead__badge">{cartCount}</span>}
      </button>
    </header>
  );
}
