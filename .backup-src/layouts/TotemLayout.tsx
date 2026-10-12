import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { TotemHeader } from './TotemHeader';
import { useCartStore } from '@/contexts/CartContext';
import './TotemLayout.css';
export function TotemLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const count = useCartStore((s) => s.itemCount());
  useEffect(() => {
    document.body.classList.add('kiosk');
    return () => document.body.classList.remove('kiosk');
  }, []);
  const hideHeader = ['/splash', '/welcome', '/payment/processing', '/payment/approved',
    '/order/confirmed', '/order/printing'].includes(location.pathname)
    || location.pathname.startsWith('/error/');
  return (
    <div className="tlayout">
      {!hideHeader && (
        <TotemHeader cartCount={count}
          onMenuClick={() => navigate('/menu')}
          onCartClick={() => navigate('/cart')} />
      )}
      <main className="tlayout__main"><Outlet /></main>
    </div>
  );
}
