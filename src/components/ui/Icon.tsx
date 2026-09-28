import type { SVGProps } from 'react';
import type { CategoryIcon } from '@/types';
type IconProps = SVGProps<SVGSVGElement> & { size?: number };
function base({ size = 24, ...rest }: IconProps): SVGProps<SVGSVGElement> {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round',
    strokeLinejoin: 'round', 'aria-hidden': true, ...rest };
}
export const IconCart = (p: IconProps) => (<svg {...base(p)}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>);
export const IconMenu = (p: IconProps) => (<svg {...base(p)}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
export const IconBack = (p: IconProps) => (<svg {...base(p)}><polyline points="15 18 9 12 15 6"/></svg>);
export const IconCheck = (p: IconProps) => (<svg {...base(p)}><polyline points="20 6 9 17 4 12"/></svg>);
export const IconX = (p: IconProps) => (<svg {...base(p)}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
export const IconMail = (p: IconProps) => (<svg {...base(p)}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,6 12,13 22,6"/></svg>);
export const IconPlus = (p: IconProps) => (<svg {...base(p)}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
export const IconMinus = (p: IconProps) => (<svg {...base(p)}><line x1="5" y1="12" x2="19" y2="12"/></svg>);
export const IconPix = (p: IconProps) => (<svg {...base(p)}><path d="M12 2 L22 12 L12 22 L2 12 Z"/><path d="M12 7 L17 12 L12 17 L7 12 Z"/></svg>);

export const IconCatAll = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
);
export const IconCatCombo = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="8" width="18" height="3" rx="1"/><rect x="3" y="12" width="18" height="3" rx="1"/><rect x="3" y="16" width="18" height="3" rx="1"/></svg>
);
export const IconCatBurger = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 11h18c0-3-3-6-9-6s-9 3-9 6z"/><rect x="3" y="12" width="18" height="3" rx="1"/><path d="M3 16h18c0 3-3 5-9 5s-9-2-9-5z"/></svg>
);
export const IconCatFries = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 11 L7 21 L17 21 L19 11"/><rect x="9" y="4" width="2" height="8" rx="0.5"/><rect x="12" y="2" width="2" height="10" rx="0.5"/><rect x="15" y="5" width="2" height="7" rx="0.5"/></svg>
);
export const IconCatDrink = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 8 L7 21 L17 21 L18 8"/><path d="M8 8 L8 4 L16 4 L16 8"/><line x1="6" y1="12" x2="18" y2="12"/></svg>
);
export const IconCatDessert = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 21 L19 21 L16 9 L8 9 Z"/><path d="M8 9 Q12 3 16 9"/><circle cx="12" cy="6" r="1"/></svg>
);
export const CATEGORY_ICONS: Record<CategoryIcon, React.FC<IconProps>> = {
  all: IconCatAll, combo: IconCatCombo, burger: IconCatBurger,
  fries: IconCatFries, drink: IconCatDrink, dessert: IconCatDessert,
};
