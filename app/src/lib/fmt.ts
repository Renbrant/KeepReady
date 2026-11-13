const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const usdf = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' });

export const n0 = (x: number) => nf0.format(x);
export const n1 = (x: number) => nf1.format(x);
export const n2 = (x: number) => nf2.format(x);
export const usd = (x: number) => usdf.format(x);

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
