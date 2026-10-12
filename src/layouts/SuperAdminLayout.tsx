import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSuperAdminStore } from '@/contexts/SuperAdminContext';
import { BRAND } from '@/config/brand';
import './SuperAdminLayout.css';
const MENU = [
  { to: '/superadmin', end: true, label: 'Visão geral' },
  { to: '/superadmin/clientes', label: 'Clientes' },
  { to: '/superadmin/boletos', label: 'Boletos' },
  { to: '/superadmin/planos', label: 'Planos' },
  { to: '/superadmin/relatorios', label: 'Relatórios' },
  { to: '/superadmin/configuracoes', label: 'Configurações' },
];
export function SuperAdminLayout() {
  const navigate = useNavigate();
  const logout = useSuperAdminStore((s) => s.logout);
  return (
    <div className="super">
      <aside className="super__sidebar">
        <div className="super__brand">
          <span className="super__brand-logo">🍔</span>
          <div>
            <span className="super__brand-name">{BRAND.name}</span>
            <span className="super__brand-role">Console interno</span>
          </div>
        </div>
        <nav className="super__nav">
          {MENU.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.end}
              className={({ isActive }) => `super__link ${isActive ? 'super__link--active' : ''}`}>
              {m.label}
            </NavLink>
          ))}
        </nav>
        <button className="super__logout"
          onClick={() => { logout(); navigate('/superadmin/login', { replace: true }); }}>
          Sair do console
        </button>
      </aside>
      <main className="super__main"><Outlet /></main>
    </div>
  );
}
