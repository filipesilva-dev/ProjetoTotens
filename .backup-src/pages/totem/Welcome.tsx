import { useNavigate } from 'react-router-dom';
import { Button, Text } from '@/components/ui';
import { BRAND } from '@/config/brand';
import './Welcome.css';
export default function Welcome() {
  const nav = useNavigate();
  return (
    <div className="welcome">
      <div className="welcome__hero">
        <div className="welcome__logo">🍔</div>
        <Text as="h1" size="4xl" weight="black" style={{ color: '#fff', letterSpacing: -1 }}>{BRAND.name}</Text>
        <Text size="lg" style={{ color: 'rgba(255,255,255,.92)' }}>{BRAND.tagline}</Text>
        <div className="welcome__badge"><span>⚡ Pagamento via Pix</span></div>
      </div>
      <div className="welcome__cta">
        <Button size="xl" fullWidth onClick={() => nav('/menu')}>Iniciar pedido</Button>
        <Text tone="soft" size="sm" style={{ textAlign: 'center', marginTop: 16 }}>Toque para começar</Text>
      </div>
    </div>
  );
}
