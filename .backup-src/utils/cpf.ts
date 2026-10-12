export function onlyDigits(s: string): string { return s.replace(/\D+/g, ''); }
export function maskCPF(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}
export function isValidCPF(value: string): boolean {
  const c = onlyDigits(value);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const calc = (s: string, f: number) => {
    let sum = 0;
    for (const ch of s) sum += Number(ch) * f--;
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(c.slice(0,9), 10) === Number(c[9]) && calc(c.slice(0,10), 11) === Number(c[10]);
}
