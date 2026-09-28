import { useNavigate } from 'react-router-dom';
import { Button, IconCart, Text } from '@/components/ui';
export default function CartEmpty() {
  const nav = useNavigate();
  return (
    <div className="screen screen--center">
      <div style={{ color: 'var(--color-border-strong)' }}><IconCart size={140} /></div>
      <Text as="h1" size="3xl" weight="black">Carrinho vazio</Text>
      <Text tone="muted">Adicione itens para começar</Text>
      <Button size="lg" onClick={() => nav('/menu')}>Ver cardápio</Button>
    </div>
  );
}
