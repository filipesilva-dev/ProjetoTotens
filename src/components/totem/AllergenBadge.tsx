import type { Allergen } from '@/types';
import { ALLERGEN_LABELS } from '@/config/allergens';
import './AllergenBadge.css';

export interface AllergenBadgeProps {
  allergen: Allergen;
}

export function AllergenBadge({ allergen }: AllergenBadgeProps) {
  const info = ALLERGEN_LABELS[allergen];
  return (
    <div className="allergen" role="listitem">
      <span className="allergen__icon" aria-hidden>{info.emoji}</span>
      <span className="allergen__label">{info.label}</span>
    </div>
  );
}
