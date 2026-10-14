import { Link, Outlet, useLocation } from 'react-router-dom';
import { Text } from '@/components/ui';
import { BRAND } from '@/config/brand';
import './InicioLayout.css';
export function InicioLayout() {
  const location = useLocation();
  const links = [
    { to: '/planos', label: 'Planos' },
    { to: '/recursos', label: 'Recursos' },
    { to: '/sobre', label: 'Sobre' },
  ];
  return (
    <div className="inicio">
      <header className="inicio__header">
        <Link to="/" className="inicio__brand">
          <span className="inicio__brand-logo">🍔</span>
          <span className="inicio__brand-name">{BRAND.name}</span>
        </Link>
        <nav className="inicio__nav">
          {links.map((l) => (
            <Link key={l.to} to={l.to}
              className={`mkt__link ${location.pathname === l.to ? 'mkt__link--active' : ''}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="inicio__actions">
          <Link to="/entrar" className="inicio__login">Entrar</Link>
          <Link to="/cadastro" className="inicio__cta">Começar agora</Link>
        </div>
      </header>
      <main className="inicio__main"><Outlet /></main>
      <footer className="inicio__footer">
        <div className="inicio__footer-cols">
          <div className="inicio__footer-brand">
            <span className="inicio__brand-logo">🍔</span>
            <Text weight="black" size="lg">{BRAND.name}</Text>
            <Text tone="muted" size="sm">{BRAND.tagline}</Text>
          </div>
          <div className="inicio__footer-col">
            <Text weight="bold" size="sm">Produto</Text>
            <Link to="/planos" className="inicio__footer-link">Planos</Link>
            <Link to="/recursos" className="inicio__footer-link">Recursos</Link>
          </div>
          <div className="inicio__footer-col">
            <Text weight="bold" size="sm">Empresa</Text>
            <Link to="/sobre" className="inicio__footer-link">Sobre</Link>
            <Link to="/contato" className="inicio__footer-link">Contato</Link>
          </div>
          <div className="inicio__footer-col">
            <Text weight="bold" size="sm">Acesso</Text>
            <Link to="/entrar" className="inicio__footer-link">Entrar</Link>
            <Link to="/cadastro" className="inicio__footer-link">Criar conta</Link>
            <Link to="/superadmin/login" className="inicio__footer-link">Console interno</Link>
          </div>
        </div>
        <div className="inicio__footer-bottom">
          <Text tone="soft" size="xs">© {new Date().getFullYear()} {BRAND.name}. Todos os direitos reservados.</Text>
        </div>
      </footer>
    </div>
  );
}
