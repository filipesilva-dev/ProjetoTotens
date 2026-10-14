import type { Allergen } from '@/types';
import { ALLERGEN_LABELS } from '@/config/allergens';
import './AllergenBadge.css';
export function AllergenBadge({ allergen }: { allergen: Allergen }) {
  const info = ALLERGEN_LABELS[allergen];
  return (
    <div className="allergen" role="listitem">
      <span className="allergen__icon" aria-hidden>{info.emoji}</span>
      <span className="allergen__label">{info.label}</span>
    </div>
  );
}
