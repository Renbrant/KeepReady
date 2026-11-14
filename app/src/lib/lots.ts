import { diffDays } from './dates';
import { norm } from '../content/storage';
import { STORED_EN } from '../content/stored-en';
import type { PantryItem, StockLot } from './types';

type WithId<T> = T & { id: string };

/** Próximo número base de etiqueta. Olha o número no começo de cada etiqueta ("12", "12a" contam como 12). */
export function nextLabelBase(lots: { label?: string }[]): number {
  let max = 0;
  for (const l of lots) {
    const m = /^(\d+)/.exec(l.label ?? '');
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

/** Etiqueta da parte i (0, 1, 2...) de um desmembramento: "12a", "12b"... Passa de 26 partes vira "12-27". */
export function partLabel(base: string, i: number): string {
  return i < 26 ? `${base}${String.fromCharCode(97 + i)}` : `${base}-${i + 1}`;
}

/**
 * Etiqueta da parte i ao desmembrar um lote com etiqueta `base`.
 * Etiqueta só com número ("12") vira 12a, 12b. Se já é uma parte ("12a"), vira 12a.1, 12a.2, sem repetir as irmãs.
 */
export function childLabel(base: string, i: number): string {
  return /^\d+$/.test(base) ? partLabel(base, i) : `${base}.${i + 1}`;
}

/** Divide `qty` em `parts` partes iguais com uma casa decimal. A última leva a sobra, e a soma é sempre `qty`. */
export function splitQuantities(qty: number, parts: number): number[] {
  const n = Math.max(1, Math.floor(parts));
  const each = Math.floor((qty / n) * 10) / 10;
  const out = Array<number>(n).fill(each);
  out[n - 1] = Math.round((qty - each * (n - 1)) * 10) / 10;
  return out;
}

/** Texto para escrever à caneta no pacote: código e validade (mês/ano). */
export function labelText(l: { label?: string; expiresOn?: string }): string {
  const parts: string[] = [];
  if (l.label) parts.push(l.label);
  if (l.expiresOn) {
    const [y, m] = l.expiresOn.split('-');
    parts.push(`${m}/${y}`);
  }
  return parts.join(' · ');
}

export interface SplitPart {
  qty: number;
  expiresOn?: string;
}

export interface SplitResult {
  puts: { id: string; data: StockLot }[];
  removeId: string;
}

/**
 * Desmembra um lote em vários, cada um com sua etiqueta (12a, 12b...). O lote original sai.
 * A soma das partes deve ser a quantidade do original; o chamador confere.
 */
export function splitLot(parent: WithId<StockLot>, parts: SplitPart[], base: string, makeId: (prefix: string) => string, startOrder: number): SplitResult {
  const { id: _id, ...rest } = parent;
  const puts = parts.map((p, i) => ({
    id: makeId('lot'),
    data: {
      ...rest,
      qty: p.qty,
      expiresOn: p.expiresOn ?? parent.expiresOn,
      label: childLabel(base, i),
      splitFrom: parent.label ?? parent.name,
      order: startOrder + i,
    } satisfies StockLot,
  }));
  return { puts, removeId: parent.id };
}

/** Consome `amount` de um lote. Devolve o lote atualizado, ou null se acabou, e quanto foi de fato usado. */
export function consumeLot(l: StockLot, amount: number): { lot: StockLot | null; used: number } {
  const used = Math.max(0, Math.min(amount, l.qty));
  const left = Math.round((l.qty - used) * 100) / 100;
  return { lot: left > 0 ? { ...l, qty: left } : null, used };
}

export type LotStatus = { tone: 'bad' | 'warn' | 'ok' | 'neutral'; days?: number };

export function lotStatus(l: { expiresOn?: string }, today: string, warnDays = 90): LotStatus {
  if (!l.expiresOn) return { tone: 'neutral' };
  const d = diffDays(today, l.expiresOn);
  return { tone: d < 0 ? 'bad' : d <= warnDays ? 'warn' : 'ok', days: d };
}

/** Lotes vencidos ou que vencem em até `days` dias, os mais urgentes primeiro. */
export function expiringLots<T extends { expiresOn?: string; qty: number }>(lots: T[], today: string, days = 90): T[] {
  return lots
    .filter((l) => l.qty > 0 && l.expiresOn && diffDays(today, l.expiresOn) <= days)
    .sort((a, b) => (a.expiresOn! < b.expiresOn! ? -1 : 1));
}

/* ---------- Ligação com a despensa ---------- */

const SYNONYMS: Record<string, string[]> = {
  tuna: ['atum'],
  sardine: ['sardinha'],
  sardines: ['sardinha'],
  chicken: ['frango'],
  peanut: ['amendoim'],
  oil: ['oleo'],
  crackers: ['biscoito'],
  cracker: ['biscoito'],
  jerky: ['carne', 'seca'],
  bars: ['barras'],
  bar: ['barras'],
  protein: ['proteina'],
  soup: ['sopas'],
  beans: ['feijao'],
  vegetables: ['legumes'],
  chili: ['carne', 'ensopado'],
  stew: ['ensopado'],
};

const GENERIC = new Set(['lata', 'latas', 'can', 'cans', 'canned', 'kirkland', 'organic', 'organica', 'de', 'em', 'e', 'ou', 'the', 'and', 'com', 'with', 'pacote', 'pack', 'saco', 'bag', 'box', 'caixa']);

function tokens(s: string): string[] {
  const base = norm(s).split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !GENERIC.has(t));
  const extra = base.flatMap((t) => SYNONYMS[t] ?? []);
  return [...base, ...extra];
}

/** Melhor item da despensa para o nome digitado. Devolve o id, ou undefined se nada combina. */
export function matchPantry(name: string, pantry: WithId<PantryItem>[]): string | undefined {
  const want = new Set(tokens(name));
  if (want.size === 0) return undefined;
  let best: { id: string; score: number } | undefined;
  for (const p of pantry) {
    const have = new Set([...tokens(p.name), ...tokens(STORED_EN[p.name] ?? '')]);
    let score = 0;
    for (const t of want) if (have.has(t)) score++;
    if (score > 0 && (!best || score > best.score)) best = { id: p.id, score };
  }
  return best?.id;
}
