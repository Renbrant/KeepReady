import type { Bucket, Member, PantryItem, Settings, ShopItem, Supplies } from './types';
import { DAYS_PER_MONTH, addDays, addMonths, diffDays } from './dates';
import { memberTarget } from './nutrition';

export const GAL_L = 3.785411784;
export const LB_KG = 0.45359237;

/** Água de cozimento do plano: 37,2 L por balde de grãos (5 dias, 4 pessoas) = 1,86 L por pessoa-dia, ao nível do mar. */
export const COOKING_L_PER_PERSON_DAY = 1.86;
/** Plano base: 4 pessoas a 2.000 kcal. */
export const PLAN_KCAL_PER_DAY = 8000;
export const BURNER_BTU_H = 10000;
export const PROPANE_BTU_PER_LB = 21500;
export const CYLINDER_LB = 20;
export const CYLINDER_BTU = CYLINDER_LB * PROPANE_BTU_PER_LB;

/** Minutos de fogo por dia no plano base (4 pessoas, nível do mar, uma boca a 10.000 BTU/h). */
export const COOK_MIN = { rice: 37.5, pasta: 18, oats: 12, hotWater: 15, beansPressure: 60, beansOpen: 135 };

export function round(n: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/* ---------- Calorias e estoque ---------- */

export function householdKcalPerDay(members: Member[]): number {
  return members.reduce((s, m) => s + memberTarget(m), 0);
}

export function bucketKcal(b: Bucket): number {
  return b.items.reduce((s, i) => s + i.kg * i.kcalPerKg, 0);
}

export function bucketKg(b: Bucket): number {
  return b.items.reduce((s, i) => s + i.kg, 0);
}

export function pantryKcalHave(items: PantryItem[]): number {
  return items.reduce((s, i) => s + i.haveQty * i.kcalPerUnit, 0);
}

export function pantryKcalPlan(items: PantryItem[]): number {
  return items.reduce((s, i) => s + i.planQty * i.kcalPerUnit, 0);
}

export interface Stock {
  bucketsKcal: number;
  pantryKcal: number;
  totalKcal: number;
  /** Tudo o que o plano prevê, mesmo o que ainda não foi montado. */
  plannedKcal: number;
}

/** Só balde lacrado conta como estoque. Balde em rotação está sendo comido, então sai da conta até ser reposto. */
export function stockKcal(buckets: Bucket[], pantry: PantryItem[]): Stock {
  const bucketsKcal = buckets.filter((b) => b.status === 'sealed').reduce((s, b) => s + bucketKcal(b), 0);
  const pk = pantryKcalHave(pantry);
  const plannedKcal = buckets.reduce((s, b) => s + bucketKcal(b), 0) + pantryKcalPlan(pantry);
  return { bucketsKcal, pantryKcal: pk, totalKcal: bucketsKcal + pk, plannedKcal };
}

export function foodDays(kcal: number, kcalPerDay: number): number {
  return kcalPerDay > 0 ? kcal / kcalPerDay : 0;
}

/* ---------- Altitude ---------- */

export interface AltitudeFactors {
  /** Panela de pressão: +5% de tempo por 1.000 pés acima de 2.000 (Colorado State University). */
  pressure: number;
  /** Panela aberta: estimativa. +25% a 5.000 pés (CSU cita +1/4 para carnes cozidas), proporcional à altitude acima de 2.000 pés. */
  open: number;
  /** Água de cozimento extra por evaporação: estimativa de +15% a 5.000 pés, proporcional. */
  water: number;
}

export function altitudeFactors(altitudeFt: number): AltitudeFactors {
  const above = Math.max(0, altitudeFt - 2000);
  return {
    pressure: 1 + 0.05 * (above / 1000),
    open: 1 + 0.25 * (above / 3000),
    water: 1 + 0.15 * (above / 3000),
  };
}

/* ---------- Água ---------- */

export function cookingWaterLPerDay(kcalPerDay: number, s: Settings): number {
  const people2000 = kcalPerDay / 2000;
  return COOKING_L_PER_PERSON_DAY * people2000 * altitudeFactors(s.altitudeFt).water;
}

export function waterLPerDay(members: Member[], kcalPerDay: number, s: Settings): number {
  return members.length * s.drinkLPerPersonDay + cookingWaterLPerDay(kcalPerDay, s);
}

export function waterDays(sup: Supplies, members: Member[], kcalPerDay: number, s: Settings): number {
  const perDay = waterLPerDay(members, kcalPerDay, s);
  return perDay > 0 ? (sup.waterGal * GAL_L) / perDay : 0;
}

/** Quanta água o plano pede para `daysTarget` dias, em galões. */
export function waterNeededGal(members: Member[], kcalPerDay: number, s: Settings): number {
  return (waterLPerDay(members, kcalPerDay, s) * s.daysTarget) / GAL_L;
}

/* ---------- Gás ---------- */

export function cookingMinutesPerDay(kcalPerDay: number, s: Settings): number {
  const f = altitudeFactors(s.altitudeFt);
  const beans = s.cookingMode === 'pressure' ? COOK_MIN.beansPressure * f.pressure : COOK_MIN.beansOpen * f.open;
  const base = (COOK_MIN.rice + COOK_MIN.pasta + COOK_MIN.oats) * f.open + beans + COOK_MIN.hotWater;
  return base * (kcalPerDay / PLAN_KCAL_PER_DAY);
}

export function gasBtuPerDay(kcalPerDay: number, s: Settings): number {
  return (cookingMinutesPerDay(kcalPerDay, s) / 60) * BURNER_BTU_H;
}

export function gasDays(sup: Supplies, kcalPerDay: number, s: Settings): number {
  const perDay = gasBtuPerDay(kcalPerDay, s);
  return perDay > 0 ? (sup.propaneFull * CYLINDER_BTU) / perDay : 0;
}

/** Folga recomendada sobre o gás estimado (as estimativas de altitude são incertas e o frio reduz a vazão). */
export const GAS_SAFETY_MARGIN = 1.2;

export function cylindersNeeded(kcalPerDay: number, s: Settings, margin = GAS_SAFETY_MARGIN): number {
  return Math.ceil((gasBtuPerDay(kcalPerDay, s) * s.daysTarget * margin) / CYLINDER_BTU);
}

/* ---------- Autonomia e prontidão ---------- */

export type Pillar = 'food' | 'water' | 'gas';

export interface Autonomy {
  food: number;
  water: number;
  gas: number;
  min: number;
  limiting: Pillar;
}

export function autonomy(food: number, water: number, gas: number): Autonomy {
  const entries: [Pillar, number][] = [['food', food], ['water', water], ['gas', gas]];
  entries.sort((a, b) => a[1] - b[1]);
  return { food, water, gas, min: entries[0][1], limiting: entries[0][0] };
}

/** 0 a 100: média de quanto cada pilar cobre da meta de dias (limitada a 100% por pilar). */
export function readinessScore(a: Autonomy, daysTarget: number): number {
  if (daysTarget <= 0) return 0;
  const part = (d: number) => Math.min(d / daysTarget, 1);
  return Math.round(((part(a.food) + part(a.water) + part(a.gas)) / 3) * 100);
}

/* ---------- Rotação (um balde por vez) ---------- */

export const SOON_DAYS = 30;

/**
 * Datas do primeiro ciclo, escalonadas para que um balde venha a cada T/N meses.
 * O balde n (1..N) vence em n × T/N meses; o último vence em T meses.
 */
export function firstCycleDueOn(sealedOn: string, n: number, total: number, months: number): string {
  return addDays(sealedOn, Math.round((n * months * DAYS_PER_MONTH) / total));
}

export function sealBucket(b: Bucket, today: string, months: number, totalBuckets: number): Bucket {
  const first = b.cycle === 0;
  return {
    ...b,
    status: 'sealed',
    sealedOn: today,
    dueOn: first ? firstCycleDueOn(today, b.n, totalBuckets, months) : addMonths(today, months),
    cycle: first ? 1 : b.cycle,
    rotationStartedOn: undefined,
  };
}

export type StartCheck = { ok: true } | { ok: false; reason: string };

export function canStartRotation(buckets: Bucket[], n: number): StartCheck {
  const target = buckets.find((b) => b.n === n);
  if (!target) return { ok: false, reason: 'Balde não encontrado.' };
  if (target.status !== 'sealed') return { ok: false, reason: 'Só um balde lacrado pode entrar em rotação.' };
  const active = buckets.find((b) => b.status === 'rotating');
  if (active) return { ok: false, reason: `O ${active.name} já está em rotação. Conclua a reposição dele antes de abrir outro.` };
  return { ok: true };
}

export function startRotation(b: Bucket, today: string): Bucket {
  return { ...b, status: 'rotating', rotationStartedOn: today };
}

export function finishRotation(b: Bucket, today: string, months: number): Bucket {
  return { ...b, status: 'sealed', sealedOn: today, dueOn: addMonths(today, months), cycle: b.cycle + 1, rotationStartedOn: undefined };
}

export type RotStatus = 'planned' | 'ok' | 'soon' | 'overdue' | 'rotating';

export interface RotRow {
  bucket: Bucket;
  status: RotStatus;
  dueOn?: string;
  daysToDue?: number;
}

export function rotationRows(buckets: Bucket[], today: string): RotRow[] {
  return buckets.map((bucket) => {
    if (bucket.status === 'planned') return { bucket, status: 'planned' as const };
    if (bucket.status === 'rotating') return { bucket, status: 'rotating' as const, dueOn: bucket.dueOn };
    const dueOn = bucket.dueOn;
    if (!dueOn) return { bucket, status: 'ok' as const };
    const d = diffDays(today, dueOn);
    const status: RotStatus = d < 0 ? 'overdue' : d <= SOON_DAYS ? 'soon' : 'ok';
    return { bucket, status, dueOn, daysToDue: d };
  });
}

/** Próximo balde a rotacionar: o lacrado com a data mais próxima (ou já vencido). */
export function nextDue(rows: RotRow[]): RotRow | undefined {
  return rows
    .filter((r) => r.bucket.status === 'sealed' && r.dueOn)
    .sort((a, b) => (a.dueOn! < b.dueOn! ? -1 : 1))[0];
}

export interface ScheduleEvent {
  n: number;
  name: string;
  date: string;
  /** Número da rotação deste balde (1 = a primeira vez que ele é reposto). */
  cycle: number;
  hypothetical: boolean;
}

/**
 * Calendário de rotações para os próximos meses, supondo que cada balde é reposto no dia do vencimento.
 * Baldes ainda não lacrados entram como se fossem lacrados hoje, e isso fica marcado como hipotético.
 */
export function projectSchedule(buckets: Bucket[], months: number, today: string, horizonMonths = 36): ScheduleEvent[] {
  const total = buckets.length;
  const end = addMonths(today, horizonMonths);
  const state = buckets.map((b) => {
    let due: string;
    let hypothetical = false;
    if (b.status === 'sealed' && b.dueOn) due = b.dueOn;
    else if (b.status === 'rotating') due = addMonths(today, months);
    else {
      due = firstCycleDueOn(today, b.n, total, months);
      hypothetical = true;
    }
    return { b, due, cycle: Math.max(b.cycle, 1), hypothetical };
  });
  const events: ScheduleEvent[] = [];
  for (let guard = 0; guard < 500; guard++) {
    state.sort((a, b) => (a.due < b.due ? -1 : 1));
    const first = state[0];
    if (!first || first.due > end) break;
    events.push({ n: first.b.n, name: first.b.name, date: first.due, cycle: first.cycle, hypothetical: first.hypothetical });
    first.due = addMonths(first.due, months);
    first.cycle += 1;
  }
  return events;
}

/** Pares de rotações com menos de `windowDays` entre si: indicam que a reposição um por vez não cabe. */
export function overlaps(events: ScheduleEvent[], windowDays: number): [ScheduleEvent, ScheduleEvent][] {
  const out: [ScheduleEvent, ScheduleEvent][] = [];
  for (let i = 1; i < events.length; i++) {
    if (diffDays(events[i - 1].date, events[i].date) < windowDays) out.push([events[i - 1], events[i]]);
  }
  return out;
}

/* ---------- Custo de reposição ---------- */

export interface ReplacementCost {
  food: number;
  packaging: number;
  total: number;
  missingPrice: string[];
}

export function replacementCost(b: Bucket, s: Settings): ReplacementCost {
  let food = 0;
  const missingPrice: string[] = [];
  for (const i of b.items) {
    if (i.pricePerKg === undefined) missingPrice.push(i.name);
    else food += i.kg * i.pricePerKg;
  }
  const packaging = b.bags * s.packagingCostPerBag;
  return { food, packaging, total: food + packaging, missingPrice };
}

/** Itens de compra para repor um balde, em libras (as embalagens do Costco são em libras). */
export function replacementShopping(b: Bucket, startOrder: number): Omit<ShopItem, 'checked'>[] {
  return b.items.map((i, idx) => ({
    name: `${i.name} (reposição do ${b.name})`,
    qty: round(i.kg / LB_KG, 1),
    unit: 'lb',
    store: 'Reposição' as const,
    section: b.name,
    unitPrice: i.pricePerKg !== undefined ? round(i.pricePerKg * LB_KG, 3) : undefined,
    forBucket: b.n,
    order: startOrder + idx,
  }));
}

/* ---------- Despensa: validade ---------- */

export function expiringSoon(items: PantryItem[], today: string, days = 90): PantryItem[] {
  return items.filter((i) => i.haveQty > 0 && i.expiresOn && diffDays(today, i.expiresOn) <= days);
}

/* ---------- Água guardada: lotes, validade, potável x limpa ---------- */

/** Água de torneira guardada por você: troque depois deste prazo (Ready.gov cita 6 meses para água guardada em casa). */
export const TAP_WATER_MONTHS = 6;

export interface LotLike {
  gal: number;
  type: 'potavel' | 'limpa';
  origin: 'engarrafada' | 'torneira';
  filledOn?: string;
  expiresOn?: string;
}

/** Data de vencimento do lote: a que você informou ou, para água de torneira, enchimento + 6 meses. */
export function lotExpiry(l: LotLike): string | undefined {
  if (l.expiresOn) return l.expiresOn;
  if (l.origin === 'torneira' && l.filledOn) return addMonths(l.filledOn, TAP_WATER_MONTHS);
  return undefined;
}

export interface WaterSummary {
  potableGal: number;
  cleanGal: number;
  expiredGal: number;
  /** Vence em até 60 dias (e ainda conta). */
  soonGal: number;
  hasLots: boolean;
}

/** Soma só o que não venceu. Sem nenhum lote, usa o número simples de Estoque (compatível com o que você já tinha). */
export function waterSummary(lots: LotLike[], legacyPotableGal: number, today: string): WaterSummary {
  if (lots.length === 0) return { potableGal: legacyPotableGal, cleanGal: 0, expiredGal: 0, soonGal: 0, hasLots: false };
  let potableGal = 0, cleanGal = 0, expiredGal = 0, soonGal = 0;
  for (const l of lots) {
    const exp = lotExpiry(l);
    const d = exp ? diffDays(today, exp) : undefined;
    if (d !== undefined && d < 0) { expiredGal += l.gal; continue; }
    if (d !== undefined && d <= 60) soonGal += l.gal;
    if (l.type === 'potavel') potableGal += l.gal; else cleanGal += l.gal;
  }
  return { potableGal, cleanGal, expiredGal, soonGal, hasLots: true };
}

export function cleanNeededGal(members: Member[], s: Settings): number {
  return (members.length * s.cleanLPerPersonDay * s.daysTarget) / GAL_L;
}
