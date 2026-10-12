import type { Invoice } from '@/types';
const days = (n: number) => n * 24 * 3600 * 1000;
const ago = (n: number) => new Date(Date.now() - days(n)).toISOString();
const ahead = (n: number) => new Date(Date.now() + days(n)).toISOString();

export const MOCK_INVOICES: Invoice[] = [
  { id: 'inv-001', number: '2026-012', tenantId: 't-001', tenantName: 'Lanches do João', tenantSlug: 'lanches-do-joao', planId: 'pro', planName: 'Pro', amount: 399, status: 'paid', issuedAt: ago(40), dueAt: ago(30), paidAt: ago(32) },
  { id: 'inv-002', number: '2026-013', tenantId: 't-001', tenantName: 'Lanches do João', tenantSlug: 'lanches-do-joao', planId: 'pro', planName: 'Pro', amount: 399, status: 'pending', issuedAt: ago(5), dueAt: ahead(25) },
  { id: 'inv-003', number: '2026-014', tenantId: 't-002', tenantName: 'Pizzaria Bella', tenantSlug: 'pizzaria-bella', planId: 'basic', planName: 'Básico', amount: 199, status: 'pending', issuedAt: ago(3), dueAt: ahead(27) },
  { id: 'inv-004', number: '2026-015', tenantId: 't-003', tenantName: 'Burguer House', tenantSlug: 'burguer-house', planId: 'enterprise', planName: 'Enterprise', amount: 899, status: 'paid', issuedAt: ago(45), dueAt: ago(15), paidAt: ago(18) },
  { id: 'inv-005', number: '2026-016', tenantId: 't-004', tenantName: 'Taco Mexicano', tenantSlug: 'taco-mexicano', planId: 'basic', planName: 'Básico', amount: 199, status: 'overdue', issuedAt: ago(40), dueAt: ago(10) },
  { id: 'inv-006', number: '2026-017', tenantId: 't-005', tenantName: 'Açaí da Praia', tenantSlug: 'acai-da-praia', planId: 'pro', planName: 'Pro', amount: 399, status: 'overdue', issuedAt: ago(65), dueAt: ago(35) },
  { id: 'inv-007', number: '2026-018', tenantId: 't-005', tenantName: 'Açaí da Praia', tenantSlug: 'acai-da-praia', planId: 'pro', planName: 'Pro', amount: 399, status: 'cancelled', issuedAt: ago(35), dueAt: ago(5) },
  { id: 'inv-008', number: '2026-019', tenantId: 't-003', tenantName: 'Burguer House', tenantSlug: 'burguer-house', planId: 'enterprise', planName: 'Enterprise', amount: 899, status: 'pending', issuedAt: ago(1), dueAt: ahead(29) },
];
