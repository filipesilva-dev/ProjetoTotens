import { Link } from 'react-router-dom';
import { Button, Text } from '@/components/ui';
import './ContentPage.css';

const STEPS = [
  { num: '1', title: 'Acesse o painel', desc: 'Confirme seu email e entre com a conta que você acabou de criar.' },
  { num: '2', title: 'Monte seu cardápio', desc: 'Cadastre produtos, defina preços, organize em categorias e marque alergênicos.' },
  { num: '3', title: 'Configure o totem', desc: 'Aponte o navegador do totem para o link da sua loja e comece a receber pedidos.' },
  { num: '4', title: 'Acompanhe os relatórios', desc: 'Veja vendas em tempo real, ticket médio e produtos mais pedidos.' },
];

export default function Welcome() {
  return (
    <div className="cp">
      <header className="cp__head">
        <span className="cp__eyebrow">Conta criada</span>
        <Text as="h1" size="4xl" weight="black">Bem-vindo ao FastLanches</Text>
        <Text size="lg" tone="muted">Sua conta está pronta. Aqui está o próximo passo.</Text>
      </header>

      <section className="cp__grid">
        {STEPS.map((s) => (
          <div key={s.num} className="cp__card">
            <div className="cp__card-icon" style={{ background: 'var(--gradient-primary)', color: '#fff', fontWeight: 'var(--font-weight-black)' }}>
              {s.num}
            </div>
            <Text as="h3" size="lg" weight="black">{s.title}</Text>
            <Text tone="muted">{s.desc}</Text>
          </div>
        ))}
      </section>

      <section className="cp__section" style={{ alignItems: 'center', textAlign: 'center', padding: 'var(--space-10)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)' }}>
        <Text as="h2" size="2xl" weight="black">Pronto para começar?</Text>
        <Text tone="muted">Você tem 14 dias de acesso completo. Sem cobrança automática ao final.</Text>
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/admin"><Button size="lg">Ir para o painel</Button></Link>
          <Link to="/recursos"><Button variant="ghost" size="lg">Ver recursos</Button></Link>
        </div>
      </section>
    </div>
  );
}
