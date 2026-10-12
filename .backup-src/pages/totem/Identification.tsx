import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Text } from '@/components/ui';
import { ProgressSteps } from '@/components/totem/ProgressSteps';
import { useCartStore } from '@/contexts/CartContext';
import { maskCPF, isValidCPF } from '@/utils/cpf';
import './Identification.css';

/**
 * Identificação.
 *
 * Decisão de produto: informar CPF NÃO é o caminho principal.
 * O cliente informa se quiser a nota fiscal — caso contrário, pula.
 *
 * Motivação: cada toque na tela do totem adiciona tempo de fila.
 * Pular o CPF reduz a jornada de 4 para 2 toques no fluxo ideal.
 */
export default function Identification() {
  const nav = useNavigate();
  const setCpf = useCartStore((s) => s.setCpf);

  const [cpf, setCpfLocal] = useState('');
  const [error, setError] = useState<string | undefined>();

  const handleSkip = () => {
    setCpf(undefined);
    nav('/invoice-email');
  };

  const handleConfirm = () => {
    if (!isValidCPF(cpf)) { setError('CPF inválido — verifique os dígitos'); return; }
    setCpf(cpf);
    nav('/invoice-email');
  };

  return (
    <div className="screen screen--narrow">
      <ProgressSteps current={0} />

      <div className="id__head">
        <Text as="h1" size="3xl" weight="black" style={{ textAlign: 'center' }}>Identificação</Text>
        <Text tone="muted" style={{ textAlign: 'center' }}>
          Informe o CPF <em>apenas se</em> quiser a nota fiscal
        </Text>
      </div>

      {/* CTA PRINCIPAL: pular */}
      <button type="button" className="id__skip" onClick={handleSkip}>
        <span className="id__skip-icon" aria-hidden>⚡</span>
        <span className="id__skip-text">
          <Text as="span" size="xl" weight="black" tone="inverse" style={{ display: 'block' }}>
            Seguir sem identificação
          </Text>
          <Text as="span" size="sm" style={{ display: 'block', color: 'rgba(255,255,255,.9)' }}>
            Recomendado · Mais rápido
          </Text>
        </span>
        <span className="id__skip-arrow" aria-hidden>→</span>
      </button>

      <div className="id__divider"><span>ou informe seu CPF</span></div>

      <Input
        label="CPF"
        size="lg"
        placeholder="000.000.000-00"
        value={cpf}
        onChange={(e) => { setCpfLocal(maskCPF(e.target.value)); setError(undefined); }}
        error={error}
        hint="🔒 Seus dados são tratados conforme a LGPD"
      />

      <Button variant="ghost" size="lg" fullWidth onClick={handleConfirm}>
        Confirmar CPF na nota
      </Button>

      <Card variant="flat" padding="md">
        <Text weight="bold">Por que informar o CPF?</Text>
        <Text tone="muted" size="sm">• Sua nota fiscal é emitida automaticamente</Text>
        <Text tone="muted" size="sm">• Você pode receber por email depois</Text>
        <Text tone="muted" size="sm">• Dados protegidos por lei (LGPD)</Text>
      </Card>
    </div>
  );
}
