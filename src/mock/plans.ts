import type { Plan } from '@/types';
export const MOCK_PLANS: Plan[] = [
  { id: 'basic', name: 'Básico', description: 'Para lanchonetes que estão começando a digitalizar.',
    priceMonthly: 199, priceYearly: 1990,
    features: ['1 totem incluído', 'Até 50 produtos cadastrados', 'Pagamento via Pix', 'Painel administrativo completo', 'Relatórios essenciais', 'Suporte por email'],
    maxTotems: 1, maxProducts: 50, highlighted: false, active: true, sortOrder: 1 },
  { id: 'pro', name: 'Pro', description: 'Para lojas com movimento médio e múltiplos caixas.',
    priceMonthly: 399, priceYearly: 3990,
    features: ['Até 3 totens', 'Produtos ilimitados', 'Relatórios avançados', 'Sugestões de upsell automáticas', 'Suporte prioritário', 'Integração com KDS'],
    maxTotems: 3, maxProducts: -1, highlighted: true, active: true, sortOrder: 2 },
  { id: 'enterprise', name: 'Enterprise', description: 'Para redes com operação em várias unidades.',
    priceMonthly: 899, priceYearly: 8990,
    features: ['Totens ilimitados', 'Multi-loja com gestão centralizada', 'API dedicada e webhooks', 'Gerente de conta exclusivo', 'SLA de 99,9%', 'Integrações personalizadas'],
    maxTotems: -1, maxProducts: -1, highlighted: false, active: true, sortOrder: 3 },
];
