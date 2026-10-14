import type { Allergen } from '@/types';
export const ALLERGEN_LABELS: Record<Allergen, { label: string; emoji: string }> = {
  gluten:    { label: 'Glúten',     emoji: '🌾' },
  milk:      { label: 'Leite',      emoji: '🥛' },
  egg:       { label: 'Ovo',        emoji: '🥚' },
  peanut:    { label: 'Amendoim',   emoji: '🥜' },
  soy:       { label: 'Soja',       emoji: '🫘' },
  fish:      { label: 'Peixe',      emoji: '🐟' },
  shellfish: { label: 'Crustáceos', emoji: '🦐' },
  nuts:      { label: 'Castanhas',  emoji: '🌰' },
  sesame:    { label: 'Gergelim',   emoji: '🌱' },
};
