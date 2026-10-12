import type { SVGProps } from 'react';
import type { CategoryIcon } from '@/types';
type IconProps = SVGProps<SVGSVGElement> & { size?: number };
function base({ size = 24, ...rest }: IconProps): SVGProps<SVGSVGElement> {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': true, ...rest };
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
export const IconTrendUp = (p: IconProps) => (<svg {...base(p)}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>);
export const IconTrendDown = (p: IconProps) => (<svg {...base(p)}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>);
export const IconBuilding = (p: IconProps) => (<svg {...base(p)}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="10" y2="6"/><line x1="9" y1="10" x2="10" y2="10"/><line x1="9" y1="14" x2="10" y2="14"/><line x1="14" y1="6" x2="15" y2="6"/><line x1="14" y1="10" x2="15" y2="10"/><line x1="14" y1="14" x2="15" y2="14"/></svg>);
export const IconUsers = (p: IconProps) => (<svg {...base(p)}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
export const IconFileText = (p: IconProps) => (<svg {...base(p)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);
export const IconAlert = (p: IconProps) => (<svg {...base(p)}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
export const IconCheckCircle = (p: IconProps) => (<svg {...base(p)}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
export const IconXCircle = (p: IconProps) => (<svg {...base(p)}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>);
export const IconDollar = (p: IconProps) => (<svg {...base(p)}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
export const IconSettings = (p: IconProps) => (<svg {...base(p)}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);

export const IconCatAll = (p: IconProps) => (<svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>);
export const IconCatCombo = (p: IconProps) => (<svg {...base(p)}><rect x="3" y="8" width="18" height="3" rx="1"/><rect x="3" y="12" width="18" height="3" rx="1"/><rect x="3" y="16" width="18" height="3" rx="1"/></svg>);
export const IconCatBurger = (p: IconProps) => (<svg {...base(p)}><path d="M3 11h18c0-3-3-6-9-6s-9 3-9 6z"/><rect x="3" y="12" width="18" height="3" rx="1"/><path d="M3 16h18c0 3-3 5-9 5s-9-2-9-5z"/></svg>);
export const IconCatFries = (p: IconProps) => (<svg {...base(p)}><path d="M5 11 L7 21 L17 21 L19 11"/><rect x="9" y="4" width="2" height="8" rx="0.5"/><rect x="12" y="2" width="2" height="10" rx="0.5"/><rect x="15" y="5" width="2" height="7" rx="0.5"/></svg>);
export const IconCatDrink = (p: IconProps) => (<svg {...base(p)}><path d="M6 8 L7 21 L17 21 L18 8"/><path d="M8 8 L8 4 L16 4 L16 8"/><line x1="6" y1="12" x2="18" y2="12"/></svg>);
export const IconCatDessert = (p: IconProps) => (<svg {...base(p)}><path d="M5 21 L19 21 L16 9 L8 9 Z"/><path d="M8 9 Q12 3 16 9"/><circle cx="12" cy="6" r="1"/></svg>);
export const CATEGORY_ICONS: Record<CategoryIcon, React.FC<IconProps>> = {
  all: IconCatAll, combo: IconCatCombo, burger: IconCatBurger,
  fries: IconCatFries, drink: IconCatDrink, dessert: IconCatDessert,
};
