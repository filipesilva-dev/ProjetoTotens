import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Text } from '@/components/ui';
export default function PrintingReceipt() {
  const nav = useNavigate();
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setProgress((p) => (p >= 100 ? 100 : p + 5)), 100);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (progress >= 100) { const t = setTimeout(() => nav('/welcome'), 1200); return () => clearTimeout(t); }
  }, [progress, nav]);
  return (
    <div className="screen screen--center">
      <Text as="h1" size="3xl" weight="black">Imprimindo comprovante...</Text>
      <div style={{ width: '100%', maxWidth: 480, height: 16, background: 'var(--color-surface-2)', borderRadius: 8 }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--gradient-primary)',
          borderRadius: 8, transition: 'width 120ms linear' }} />
      </div>
      <Text weight="bold">Retire o comprovante abaixo</Text>
      <Text tone="muted" size="sm">Não se esqueça de pegar sua senha</Text>
    </div>
  );
}
