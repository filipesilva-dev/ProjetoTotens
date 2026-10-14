const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function formatBRL(v: number): string {
  return Number.isFinite(v) ? BRL.format(v) : 'R$ 0,00';
}
