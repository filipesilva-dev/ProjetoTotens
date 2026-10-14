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
  const hideHeader = ['/totem/splash', '/totem/welcome', '/totem/payment/processing',
    '/totem/payment/approved', '/totem/order/confirmed', '/totem/order/printing'].includes(location.pathname)
    || location.pathname.startsWith('/totem/error/');
  return (
    <div className="tlayout">
      {!hideHeader && (
        <TotemHeader cartCount={count}
          onMenuClick={() => navigate('/totem/menu')}
          onCartClick={() => navigate('/totem/cart')} />
      )}
      <main className="tlayout__main"><Outlet /></main>
    </div>
  );
}
