import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Text } from '@/components/ui';
import { BRAND } from '@/config/brand';
export default function Splash() {
  const nav = useNavigate();
  useEffect(() => { const t = setTimeout(() => nav('/welcome'), 2000); return () => clearTimeout(t); }, [nav]);
  return (
    <div className="screen screen--center" style={{ background: 'var(--gradient-hero)', color: '#fff' }}>
      <div style={{ fontSize: 120, lineHeight: 1 }}>🍔</div>
      <Text as="h1" size="4xl" weight="black" style={{ color: '#fff' }}>{BRAND.name}</Text>
      <Text size="lg" style={{ color: 'rgba(255,255,255,.9)' }}>{BRAND.tagline}</Text>
      <Spinner size={48} />
    </div>
  );
}
