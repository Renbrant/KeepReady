/** Datas como 'AAAA-MM-DD' no fuso do aparelho. */

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

/** Soma meses inteiros; se o dia não existir no mês de destino, usa o último dia. */
export function addMonths(s: string, n: number): string {
  const d = parseISO(s);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return todayISO(d);
}

/** Dias de `a` até `b` (positivo se b é depois de a). */
export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
}

export const DAYS_PER_MONTH = 30.4375;

export function fmtDate(s?: string): string {
  if (!s) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(parseISO(s));
}

export function fmtMonthYear(s: string): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(parseISO(s));
}
