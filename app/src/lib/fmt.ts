import { locale } from './i18n';

export const n0 = (x: number) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 0 }).format(x);
export const n1 = (x: number) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(x);
export const n2 = (x: number) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(x);
export const usd = (x: number) => new Intl.NumberFormat(locale(), { style: 'currency', currency: 'USD' }).format(x);

/** Dias com 1 casa abaixo de 10 e inteiros acima. */
export const daysFmt = (d: number) => (d < 10 ? n1(d) : n0(d));

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

export function isStandalone(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}
