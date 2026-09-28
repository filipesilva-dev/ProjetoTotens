import type { Category } from '@/types';
import { CATEGORY_ICONS, IconCatAll } from '@/components/ui';
import { cn } from '@/utils/cn';
import './Sidebar.css';
export interface SidebarProps {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}
export function Sidebar({ categories, activeId, onSelect }: SidebarProps) {
  return (
    <nav className="side" aria-label="Categorias">
      <button type="button" className={cn('side__item', activeId === null && 'side__item--active')} onClick={() => onSelect(null)}>
        <span className="side__icon"><IconCatAll size={26} /></span>
        <span className="side__label">Todos</span>
      </button>
      {categories.map((c) => {
        const Icon = CATEGORY_ICONS[c.icon];
        return (
          <button key={c.id} type="button" className={cn('side__item', activeId === c.id && 'side__item--active')} onClick={() => onSelect(c.id)}>
            <span className="side__icon"><Icon size={26} /></span>
            <span className="side__label">{c.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
