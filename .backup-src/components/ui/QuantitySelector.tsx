import { cn } from '@/utils/cn';
import { IconMinus, IconPlus } from './Icon';
import './QuantitySelector.css';
export interface QuantitySelectorProps {
  value: number; min?: number; max?: number;
  onChange: (next: number) => void;
  size?: 'md'|'lg'; className?: string;
}
export function QuantitySelector({ value, min=1, max=99, onChange, size='md', className }: QuantitySelectorProps) {
  return (
    <div className={cn('qty', `qty--${size}`, className)} role="group" aria-label="Quantidade">
      <button type="button" className="qty__btn" onClick={() => onChange(Math.max(min, value-1))}
        disabled={value <= min} aria-label="Diminuir"><IconMinus size={size==='lg'?24:18}/></button>
      <span className="qty__value" aria-live="polite">{value}</span>
      <button type="button" className="qty__btn qty__btn--primary" onClick={() => onChange(Math.min(max, value+1))}
        disabled={value >= max} aria-label="Aumentar"><IconPlus size={size==='lg'?24:18}/></button>
    </div>
  );
}
