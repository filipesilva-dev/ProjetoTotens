import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/AuthContext';
import { BRAND } from '@/config/brand';
import './AdminLayout.css';
const MENU = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Cardápio' },
  { to: '/admin/categories', label: 'Categorias' },
  { to: '/admin/orders', label: 'Pedidos' },
  { to: '/admin/reports', label: 'Relatórios' },
];
export function AdminLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="alayout">
      <aside className="alayout__sidebar">
        <div className="alayout__brand">
          <span className="alayout__logo">🍔</span>
          <span className="alayout__name">{BRAND.name}</span>
        </div>
        <nav className="alayout__nav">
          {MENU.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.end}
              className={({ isActive }) => `alayout__link ${isActive ? 'alayout__link--active' : ''}`}>
              {m.label}
            </NavLink>
          ))}
        </nav>
        <button className="alayout__logout"
          onClick={() => { logout(); navigate('/admin/login', { replace: true }); }}>
          Sair
        </button>
      </aside>
      <main className="alayout__main"><Outlet /></main>
    </div>
  );
}
