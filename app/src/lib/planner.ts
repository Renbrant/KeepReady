import { CATALOG, CATEGORY_LABEL, CATEGORY_ORDER, type CatalogItem, type Ctx } from '../content/catalog';
import { GAL_L, bucketKcal, cylindersNeeded, householdKcalPerDay, waterNeededGal } from './calc';
import { memberTarget } from './nutrition';
import { GRAIN_BAGS, MIXED_BAGS, PANTRY, grainItems, mixedItems } from './plan';
import type { Bucket, GearCategory, GearState, Member, Settings } from './types';

/* ====================================================================
 * Motor do plano: pessoas + dias + perfil → comida, baldes, água, gás e caixas.
 * Tudo aqui é função pura: não lê nem grava nada. O que muda no estoque
 * fica em apply.ts.
 * ==================================================================== */

/** Capacidade de uma caixa de 27 galões. */
export const TOTE_GAL = 27;
export const TOTE_LITERS = TOTE_GAL * GAL_L;
/** Fração do volume que dá para aproveitar ao arrumar (sobra ar entre os itens). Estimativa do app. */
export const TOTE_FILL = 0.8;

/** Até quantos dias o plano padrão usa comida pronta em vez de baldes de Mylar. */
export const SHORT_GOAL_DAYS = 14;
/** Parte mínima da comida em despensa (pronta, sem cozinhar) quando há baldes. Escolha do app. */
export const MIN_PANTRY_SHARE = 0.1;

/* ---------- Comida ---------- */

const GRAIN_KCAL = bucketKcal({ items: grainItems() } as Bucket);
const MIXED_KCAL = bucketKcal({ items: mixedItems() } as Bucket);
const PANTRY_SEED_KCAL = PANTRY.reduce((s, p) => s + p.planQty * p.kcalPerUnit, 0);

/** Proporção do plano de exemplo: 6 baldes de grãos, 1 misto e a despensa. Os baldes e a despensa mantêm essa divisão. */
const SEED_TOTAL = 6 * GRAIN_KCAL + MIXED_KCAL + PANTRY_SEED_KCAL;
export const GRAIN_SHARE = (6 * GRAIN_KCAL) / SEED_TOTAL;
export const MIXED_SHARE = MIXED_KCAL / SEED_TOTAL;

export const grainBucketKcal = (): number => GRAIN_KCAL;
export const mixedBucketKcal = (): number => MIXED_KCAL;
export const pantrySeedKcal = (): number => PANTRY_SEED_KCAL;

export interface FoodInput {
  kcalPerDay: number;
  days: number;
  bufferPct: number;
  mode: Settings['bucketMode'];
}

export interface FoodPlan {
  strategy: 'buckets' | 'pantry';
  /** kcal pedidas: dias × kcal por dia × (1 + folga). */
  needKcal: number;
  grainBuckets: number;
  /** Baldes mistos (açúcar, leite, sal, café). Com meta pequena, um só balde com quantidades reduzidas. */
  mixedBuckets: number;
  /** Fração das quantidades do balde misto de exemplo que cada balde misto leva (1 = cheio). */
  mixedScale: number;
  bucketsKcal: number;
  pantryKcal: number;
  /** Quanto a despensa pede em relação à despensa do plano de exemplo. */
  pantryScale: number;
  plannedKcal: number;
  /** Dias que o plano cobre (já com a folga). */
  coverDays: number;
}

export function planFood(i: FoodInput): FoodPlan {
  const needKcal = Math.max(0, i.kcalPerDay * i.days * (1 + Math.max(0, i.bufferPct) / 100));
  const strategy: FoodPlan['strategy'] = i.mode === 'always' || i.days > SHORT_GOAL_DAYS ? 'buckets' : 'pantry';

  let grainBuckets = 0;
  let mixedBuckets = 0;
  let mixedScale = 1;
  let bucketsKcal = 0;

  if (strategy === 'buckets' && needKcal > 0) {
    // Baldes de grãos: sempre inteiros, arredondados para cima. A despensa absorve o resto.
    grainBuckets = Math.ceil(Math.max(0, needKcal * GRAIN_SHARE) / GRAIN_KCAL - 1e-9);
    // Balde misto: quando a conta dá menos de um balde, ele vai com quantidades reduzidas.
    const f = (needKcal * MIXED_SHARE) / MIXED_KCAL;
    if (f >= 0.15) {
      mixedBuckets = Math.ceil(f - 1e-9);
      mixedScale = f / mixedBuckets;
    }
    bucketsKcal = grainBuckets * GRAIN_KCAL + mixedBuckets * mixedScale * MIXED_KCAL;
  }

  let pantryKcal = Math.max(0, needKcal - bucketsKcal);
  if (strategy === 'buckets') pantryKcal = Math.max(pantryKcal, needKcal * MIN_PANTRY_SHARE);

  const plannedKcal = bucketsKcal + pantryKcal;
  return {
    strategy,
    needKcal,
    grainBuckets,
    mixedBuckets,
    mixedScale,
    bucketsKcal,
    pantryKcal,
    pantryScale: PANTRY_SEED_KCAL > 0 ? pantryKcal / PANTRY_SEED_KCAL : 0,
    plannedKcal,
    coverDays: i.kcalPerDay > 0 ? plannedKcal / i.kcalPerDay : 0,
  };
}

/** Itens de um balde misto reduzido a `scale` (1 = o do plano de exemplo). Quantidades em kg com 2 casas. */
export function scaledMixedItems(scale: number) {
  return mixedItems().map((it) => ({ ...it, kg: Math.round(it.kg * scale * 100) / 100 }));
}

export const mixedBagsFor = (scale: number): number => Math.max(1, Math.ceil(MIXED_BAGS * scale - 1e-9));
export const grainBags = (): number => GRAIN_BAGS;

/* ---------- Caixas de 27 galões ---------- */

export interface GearRec {
  id: string;
  state: GearState;
}

export interface GearLine {
  /** Id do catálogo, ou o id do registro (sem o prefixo `gear-`) para item do usuário. */
  id: string;
  name: string;
  category: GearCategory;
  unit: string;
  need: number;
  have: number;
  missing: number;
  liters: number;
  kg: number;
  outside: boolean;
  hidden: boolean;
  /** `need` é 0: o item não se aplica a esta casa agora (por exemplo, fraldas sem bebê). */
  na: boolean;
  expiresOn?: string;
  custom: boolean;
  item?: CatalogItem;
}

export const gearRecId = (id: string): string => `gear-${id}`;

export function gearLines(ctx: Ctx, recs: GearRec[]): GearLine[] {
  const byId = new Map(recs.map((r) => [r.id, r.state]));
  const out: GearLine[] = [];

  for (const item of CATALOG) {
    const st = byId.get(gearRecId(item.id));
    const need = Math.max(0, Math.round(item.need(ctx)));
    const have = Math.max(0, st?.have ?? 0);
    const hidden = st?.hidden ?? !!item.optional;
    out.push({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      need,
      have,
      missing: hidden ? 0 : Math.max(0, need - have),
      liters: item.liters,
      kg: item.kg,
      outside: !!item.outside,
      hidden,
      na: need === 0,
      expiresOn: st?.expiresOn,
      custom: false,
      item,
    });
  }

  for (const r of recs) {
    const c = r.state.custom;
    if (!c) continue;
    const need = Math.max(0, Math.round(c.need));
    const have = Math.max(0, r.state.have ?? 0);
    const hidden = !!r.state.hidden;
    out.push({
      id: r.id.replace(/^gear-/, ''),
      name: c.name,
      category: c.category,
      unit: c.unit,
      need,
      have,
      missing: hidden ? 0 : Math.max(0, need - have),
      liters: c.liters,
      kg: c.kg,
      outside: false,
      hidden,
      na: need === 0,
      expiresOn: r.state.expiresOn,
      custom: true,
    });
  }
  return out;
}

/** O que conta para o plano: ligado e que se aplica. */
export const activeLines = (lines: GearLine[]): GearLine[] => lines.filter((l) => !l.hidden && !l.na);

export interface ToteLine {
  id: string;
  name: string;
  unit: string;
  qty: number;
}

export interface Tote {
  n: number;
  lines: ToteLine[];
  liters: number;
  kg: number;
  /** Categorias que a caixa leva, na ordem de arrumação. */
  categories: GearCategory[];
}

export interface PackOptions {
  toteLiters?: number;
  fill?: number;
  capKg: number;
}

/**
 * Arruma os itens nas caixas na ordem das categorias, enchendo uma caixa de cada vez até o limite de volume
 * (já com a folga de {@link TOTE_FILL}) ou de peso. Um item grande pode ser dividido entre duas caixas.
 * Itens que não cabem em caixa (`outside`) ficam de fora.
 */
export function packTotes(lines: GearLine[], opt: PackOptions): Tote[] {
  const volCap = (opt.toteLiters ?? TOTE_LITERS) * (opt.fill ?? TOTE_FILL);
  const kgCap = Math.max(1, opt.capKg);
  const order = (c: GearCategory) => CATEGORY_ORDER.indexOf(c);
  const items = lines
    .filter((l) => !l.outside && !l.hidden && l.need > 0)
    .map((l, idx) => ({ l, idx }))
    .sort((a, b) => order(a.l.category) - order(b.l.category) || a.idx - b.idx)
    .map((x) => x.l);

  const totes: Tote[] = [];
  const open = (): Tote => {
    const t: Tote = { n: totes.length + 1, lines: [], liters: 0, kg: 0, categories: [] };
    totes.push(t);
    return t;
  };

  for (const l of items) {
    let left = l.need;
    while (left > 0) {
      const t = totes[totes.length - 1] ?? open();
      const byVol = l.liters > 0 ? Math.floor((volCap - t.liters) / l.liters + 1e-9) : Infinity;
      const byKg = l.kg > 0 ? Math.floor((kgCap - t.kg) / l.kg + 1e-9) : Infinity;
      let fit = Math.min(byVol, byKg, left);
      if (fit <= 0) {
        if (t.lines.length === 0) fit = 1; // unidade maior que a caixa vazia: coloca assim mesmo
        else {
          open();
          continue;
        }
      }
      const tote = totes[totes.length - 1];
      tote.lines.push({ id: l.id, name: l.name, unit: l.unit, qty: fit });
      tote.liters += fit * l.liters;
      tote.kg += fit * l.kg;
      if (!tote.categories.includes(l.category)) tote.categories.push(l.category);
      left -= fit;
    }
  }
  return totes;
}

export function toteTitle(t: Tote): string {
  const names = t.categories.map((c) => CATEGORY_LABEL[c]);
  return `Caixa ${t.n}: ${names.join(' + ')}`;
}

/* ---------- Plano completo ---------- */

export interface PlanInput {
  members: Member[];
  settings: Settings;
  gear: GearRec[];
}

export interface PlanResult {
  people: number;
  kcalPerDay: number;
  days: number;
  food: FoodPlan;
  waterGal: number;
  cylinders: number;
  gearLines: GearLine[];
  totes: Tote[];
  outside: GearLine[];
  warnings: string[];
}

export function computePlan(input: PlanInput): PlanResult {
  const { members, settings } = input;
  const people = members.length;
  const days = Math.max(0, settings.daysTarget);
  const kcalPerDay = householdKcalPerDay(members);
  const ctx: Ctx = { members, people, days };

  const food = planFood({ kcalPerDay, days, bufferPct: settings.bufferPct, mode: settings.bucketMode });
  const lines = gearLines(ctx, input.gear);
  const active = activeLines(lines);
  const totes = packTotes(active, { capKg: settings.toteCapKg });

  const warnings: string[] = [];
  const noKcal = members.filter((m) => memberTarget(m) <= 0);
  if (people === 0) warnings.push('Adicione pelo menos uma pessoa.');
  if (noKcal.length > 0) warnings.push(`${noKcal.map((m) => m.name || 'Pessoa').join(', ')}: sem meta de calorias. Informe idade e sexo ou defina a meta na Família.`);
  const noProfile = members.filter((m) => m.age === undefined || m.sex === undefined);
  if (noProfile.length > 0 && noKcal.length === 0) {
    warnings.push(`Sem idade ou sexo: ${noProfile.map((m) => m.name || 'Pessoa').join(', ')}. Itens como absorventes e fraldas dependem disso.`);
  }
  if (members.some((m) => m.age !== undefined && m.age < 1)) {
    warnings.push('Bebê com menos de 1 ano: fórmula e papinha não entram nesta conta. Combine com o pediatra.');
  }

  return {
    people,
    kcalPerDay,
    days,
    food,
    waterGal: waterNeededGal(members, kcalPerDay, settings),
    cylinders: cylindersNeeded(kcalPerDay, settings),
    gearLines: lines,
    totes,
    outside: active.filter((l) => l.outside),
    warnings,
  };
}

/** Quanto das caixas já está completo: soma de min(tenho, preciso) sobre soma de preciso, nos itens ativos. */
export function gearProgress(lines: GearLine[]): { done: number; total: number; pct: number } {
  const act = activeLines(lines);
  const total = act.length;
  const done = act.filter((l) => l.have >= l.need).length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

/** Totais de volume e peso do que vai nas caixas. */
export function gearTotals(lines: GearLine[]): { liters: number; kg: number; items: number } {
  const act = activeLines(lines).filter((l) => !l.outside);
  return {
    liters: act.reduce((s, l) => s + l.need * l.liters, 0),
    kg: act.reduce((s, l) => s + l.need * l.kg, 0),
    items: act.length,
  };
}
