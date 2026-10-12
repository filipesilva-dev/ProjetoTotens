import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, IconPix, Spinner, Text } from '@/components/ui';
import { useCartStore } from '@/contexts/CartContext';
import { paymentsService } from '@/services/payments';
import { ordersService } from '@/services/orders';
import { useInterval } from '@/hooks/useInterval';
import { formatBRL } from '@/utils/currency';
import type { PixCharge } from '@/types';
import './PaymentPix.css';

/* ═════════════════════════════════════════════════════════════════════════
 * ⚠️  CONFIGURAÇÃO TEMPORÁRIA — REMOVER EM PRODUÇÃO
 * ─────────────────────────────────────────────────────────────────────────
 * Enquanto o backend FastAPI não está conectado, a tela avança sozinha
 * para /payment/approved após este intervalo, apenas para permitir testar
 * o fluxo completo do totem (pagamento → aprovação → senha).
 *
 * QUANDO O BACKEND ESTIVER PRONTO:
 *   1. Colocar PAYMENT_AUTO_ADVANCE_MS = null
 *      (ou simplesmente apagar este bloco e o useEffect abaixo)
 *   2. Descomentar o polling real em `useInterval` — ele já está escrito
 *      e faz a coisa certa: consulta o status do pagamento e só avança
 *      quando o PSP confirma via webhook.
 *
 * O valor real esperado em produção é: NUNCA avançar sozinho —
 * só a confirmação do PSP move o cliente para a tela seguinte.
 * ═══════════════════════════════════════════════════════════════════════ */
const PAYMENT_AUTO_ADVANCE_MS: number | null = 5000;

export default function PaymentPix() {
  const nav = useNavigate();
  const items = useCartStore((s) => s.items);
  const cpf = useCartStore((s) => s.cpf);
  const email = useCartStore((s) => s.email);

  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  // Cria pedido + cobrança Pix ao montar
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const order = await ordersService.create({
          items, customer: { cpf, email }, paymentMethod: 'PIX',
        });
        const pix = await paymentsService.createPixCharge(order.id, order.total);
        if (alive) setCharge(pix);
      } catch {
        if (alive) nav('/error/no-connection');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─────────────────────────────────────────────────────────────────────
   * ⚠️  AUTO-AVANÇO TEMPORÁRIO (só para testes)
   * ─────────────────────────────────────────────────────────────────────
   * Substitui o polling real. Apaga este `useEffect` quando o backend
   * estiver no ar — o polling abaixo cuidará do fluxo de verdade.
   * ─────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (PAYMENT_AUTO_ADVANCE_MS === null) return;
    if (!charge) return;
    const t = setTimeout(() => {
      useCartStore.getState().clear();
      nav('/payment/approved');
    }, PAYMENT_AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [charge, nav]);

  /* ─────────────────────────────────────────────────────────────────────
   * Polling do pagamento — código de produção
   * ─────────────────────────────────────────────────────────────────────
   * Fica desligado enquanto PAYMENT_AUTO_ADVANCE_MS !== null. Quando o
   * backend estiver pronto, apaga o bloco temporário acima, põe
   * PAYMENT_AUTO_ADVANCE_MS = null e descomenta o miolo deste `useInterval`.
   *
   * `useCartStore.getState().clear()` é usado em vez de variável de escopo
   * para não re-renderizar o componente quando o carrinho é limpo.
   * ─────────────────────────────────────────────────────────────────── */
  useInterval(async () => {
    if (!charge) return;
    setChecking(true);
    try {
      // const status = await paymentsService.getStatus(charge.orderId);
      // if (status === 'PAID') {
      //   useCartStore.getState().clear();
      //   nav('/payment/approved');
      //   return;
      // }
      // if (status === 'EXPIRED') {
      //   nav('/error/session-expired');
      //   return;
      // }
    } finally {
      setChecking(false);
    }
  }, 3000);

  if (loading) {
    return <div className="screen screen--center"><Spinner size={64} label="Gerando QR Code..." /></div>;
  }
  if (!charge) return null;

  return (
    <div className="ppix">
      <div className="ppix__head">
        <div className="ppix__icon"><IconPix size={36} /></div>
        <Text as="h1" size="3xl" weight="black" style={{ textAlign: 'center' }}>Pague com Pix</Text>
        <Text tone="muted" style={{ textAlign: 'center' }}>
          Abra o app do seu banco e escaneie o QR Code
        </Text>
      </div>

      <Card variant="raised" padding="lg" className="ppix__qr">
        <img src={charge.qrCodeImage} alt="QR Code Pix" />
      </Card>

      <Card variant="flat" padding="md" className="ppix__amount">
        <Text tone="muted" size="sm">Valor a pagar</Text>
        <Text size="3xl" weight="black" tone="primary">{formatBRL(charge.amount)}</Text>
      </Card>

      <div className="ppix__steps">
        <div className="ppix__step">
          <span className="ppix__step-num">1</span>
          <Text size="sm">Abra o app do seu banco</Text>
        </div>
        <div className="ppix__step">
          <span className="ppix__step-num">2</span>
          <Text size="sm">Escolha "Pagar com Pix"</Text>
        </div>
        <div className="ppix__step">
          <span className="ppix__step-num">3</span>
          <Text size="sm">Aponte a câmera para o QR Code</Text>
        </div>
      </div>

      <div className="ppix__status" aria-live="polite">
        <Spinner size={22} />
        <Text tone="muted" size="sm">
          {checking ? 'Verificando pagamento...' : 'Aguardando confirmação do banco...'}
        </Text>
      </div>

      <div className="ppix__actions">
        <Button variant="ghost" size="lg" onClick={() => nav('/payment')}>
          Cancelar
        </Button>
      </div>

      <Text tone="soft" size="xs" style={{ textAlign: 'center' }}>
        Assim que o banco confirmar, esta tela avança automaticamente.
        Não feche nem saia até concluir.
      </Text>
    </div>
  );
}
