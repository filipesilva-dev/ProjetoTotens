import { useNavigate } from 'react-router-dom';
import { Button, Card, IconX, Text } from '@/components/ui';
export default function SessionExpired() {
  const nav = useNavigate();
  return (
    <div className="screen screen--narrow">
      <div style={{ width: 90, height: 90, borderRadius: '50%',
        background: 'var(--color-danger-soft)', color: 'var(--color-danger)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
        <IconX size={50} />
      </div>
      <Text as="h1" size="3xl" weight="black" style={{ textAlign: 'center' }}>Sessão encerrada</Text>
      <Text tone="muted" style={{ textAlign: 'center' }}>Sua sessão expirou por inatividade.</Text>
      <Card variant="flat" padding="md">
        <Text weight="bold">Seu pedido está salvo</Text>
        <Text tone="muted" size="sm">Você pode tentar novamente.</Text>
      </Card>
      <Button size="lg" fullWidth onClick={() => nav(-1)}>Voltar</Button>
      <Button variant="ghost" size="lg" fullWidth onClick={() => nav('/welcome')}>Iniciar novo pedido</Button>
    </div>
  );
}
