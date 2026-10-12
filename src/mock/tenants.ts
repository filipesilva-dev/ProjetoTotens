import type { Tenant } from '@/types';
const days = (n: number) => n * 24 * 3600 * 1000;
const ago = (n: number) => new Date(Date.now() - days(n)).toISOString();
const ahead = (n: number) => new Date(Date.now() + days(n)).toISOString();

export const MOCK_TENANTS: Tenant[] = [
  { id: 't-001', slug: 'lanches-do-joao', name: 'Lanches do João', cnpj: '12.345.678/0001-90', logoEmoji: '🍔',
    ownerName: 'João Silva', ownerEmail: 'joao@lanchesdojoao.com', ownerPhone: '(61) 99999-0001',
    planId: 'pro', cycle: 'monthly', status: 'active', totemCount: 3,
    createdAt: ago(180), contractEndsAt: ahead(180), lastLoginAt: ago(1) },
  { id: 't-002', slug: 'pizzaria-bella', name: 'Pizzaria Bella', cnpj: '98.765.432/0001-10', logoEmoji: '🍕',
    ownerName: 'Maria Bellini', ownerEmail: 'maria@pizzariabella.com', ownerPhone: '(61) 99999-0002',
    planId: 'basic', cycle: 'monthly', status: 'active', totemCount: 1,
    createdAt: ago(90), contractEndsAt: ahead(275), lastLoginAt: ago(3) },
  { id: 't-003', slug: 'burguer-house', name: 'Burguer House', cnpj: '11.222.333/0001-44', logoEmoji: '🍟',
    ownerName: 'Carlos Mendes', ownerEmail: 'carlos@burguerhouse.com', ownerPhone: '(61) 99999-0003',
    planId: 'enterprise', cycle: 'yearly', status: 'active', totemCount: 8,
    createdAt: ago(400), contractEndsAt: ahead(120), lastLoginAt: ago(0.2) },
  { id: 't-004', slug: 'taco-mexicano', name: 'Taco Mexicano', cnpj: '55.666.777/0001-88', logoEmoji: '🌮',
    ownerName: 'Diego Ramírez', ownerEmail: 'diego@tacomexicano.com',
    planId: 'basic', cycle: 'monthly', status: 'past_due', totemCount: 1,
    createdAt: ago(60), contractEndsAt: ahead(305), lastLoginAt: ago(7) },
  { id: 't-005', slug: 'acai-da-praia', name: 'Açaí da Praia', cnpj: '22.333.444/0001-55', logoEmoji: '🍧',
    ownerName: 'Juliana Costa', ownerEmail: 'juliana@acaidapraia.com',
    planId: 'pro', cycle: 'monthly', status: 'suspended', totemCount: 2,
    createdAt: ago(240), contractEndsAt: ahead(60), lastLoginAt: ago(35) },
  { id: 't-006', slug: 'sushi-express', name: 'Sushi Express', cnpj: '77.888.999/0001-22', logoEmoji: '🍣',
    ownerName: 'Renata Nakamoto', ownerEmail: 'renata@sushiexpress.com',
    planId: 'pro', cycle: 'monthly', status: 'trial', totemCount: 1,
    createdAt: ago(5), contractEndsAt: ahead(9), lastLoginAt: ago(0.5) },
];
