import { Text } from '@/components/ui';
import './ContentPage.css';

const FEATURES = [
  { icon: '📱', title: 'Totem touchscreen', desc: 'Interface pensada para TV vertical 1080×1920. Botões grandes, fluxo rápido, sem treinamento.' },
  { icon: '⚡', title: 'Pagamento Pix', desc: 'Aprovação em segundos. Sem maquininha, sem taxa de cartão, sem hardware extra na loja.' },
  { icon: '📊', title: 'Dashboard em tempo real', desc: 'Vendas do dia, ticket médio, produtos mais pedidos. Tudo atualizado enquanto os pedidos entram.' },
  { icon: '🍔', title: 'Cardápio editável', desc: 'Adicione produtos, mude preços, ative e desative itens. Alterações refletem no totem na hora.' },
  { icon: '🏷', title: 'Categorias e alergênicos', desc: 'Organize o menu em categorias. Marque alergênicos por produto para segurança do cliente.' },
  { icon: '📋', title: 'Relatórios completos', desc: 'Faturamento por período, top produtos, formas de pagamento, filtro por categoria.' },
  { icon: '👥', title: 'Multi-loja', desc: 'Administre várias unidades de uma conta só. Ideal para redes e franquias.' },
  { icon: '🔒', title: 'Conformidade LGPD', desc: 'CPF e email só são coletados se o cliente autorizar. Dados criptografados e sem retenção desnecessária.' },
  { icon: '🖨', title: 'Integração com cozinha', desc: 'Pedidos chegam no monitor ou na impressora térmica automaticamente após o pagamento.' },
];

export default function Resources() {
  return (
    <div className="cp">
      <header className="cp__head">
        <span className="cp__eyebrow">Recursos</span>
        <Text as="h1" size="4xl" weight="black">Tudo que o seu totem precisa</Text>
        <Text size="lg" tone="muted">Do cardápio ao relatório, sem depender de integrações externas.</Text>
      </header>

      <section className="cp__grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="cp__card">
            <div className="cp__card-icon">{f.icon}</div>
            <Text as="h3" size="lg" weight="black">{f.title}</Text>
            <Text tone="muted">{f.desc}</Text>
          </div>
        ))}
      </section>
    </div>
  );
}
