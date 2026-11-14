import { LB_KG, bucketKcal, round } from './calc';
import { L, tx } from './i18n';
import { GRAIN_BAGS, PANTRY_VARIETY, grainItems } from './plan';
import { grainBucketKcal, mixedBagsFor, scaledMixedItems, MIN_PANTRY_SHARE, type PlanResult } from './planner';
import type { Bucket, PantryItem, Rec, ShopItem, Supplies } from './types';

/* ====================================================================
 * "Aplicar o plano": transforma o resultado do planner em mudanças no
 * estoque, sem apagar o que o usuário já fez.
 *   - Baldes lacrados ou em rotação nunca são tocados.
 *   - Baldes só "planejados" são recalculados (quantidades e número).
 *   - A despensa muda só o que o plano pede (a coluna "tenho" fica como está).
 *   - Itens de compra que você marcou como comprados ou que você mesmo
 *     adicionou ficam como estão.
 * Aqui tudo é função pura: devolve uma lista de operações.
 * ==================================================================== */

type WithId<T> = T & { id: string };

export type Op = { type: 'put'; kind: Rec['kind']; id: string; data: unknown } | { type: 'remove'; id: string };

export interface ApplyState {
  plan: PlanResult;
  buckets: WithId<Bucket>[];
  pantry: WithId<PantryItem>[];
  shop: WithId<ShopItem>[];
  sup: Supplies;
  makeId: (prefix: string) => string;
  /** Adicionar os itens de variedade à despensa (só na primeira vez). */
  addVariety?: boolean;
}

export interface ApplyPreview {
  ops: Op[];
  /** Frases curtas para mostrar antes de confirmar. */
  lines: string[];
}

/* ---------- Baldes ---------- */

export interface BucketReconcile {
  upserts: { id: string; data: Bucket }[];
  removeIds: string[];
  /** Quantos baldes de cada tipo já estão lacrados ou em rotação (não mudam). */
  locked: { grain: number; mixed: number };
  /** Quantos desses passam da meta. */
  over: { grain: number; mixed: number };
  /** Total de baldes de cada tipo depois de aplicar. */
  after: { grain: number; mixed: number };
  /** Baldes planejados depois de aplicar (os que ainda vão ser comprados e lacrados). */
  planned: Bucket[];
  /** kcal de todos os baldes depois de aplicar (lacrados com o conteúdo real + planejados). */
  kcalAfter: number;
}

export function reconcileBuckets(
  existing: WithId<Bucket>[],
  want: { grain: number; mixed: number; mixedScale: number },
  kcalPerDay: number,
  makeId: (prefix: string) => string,
): BucketReconcile {
  const sorted = [...existing].sort((a, b) => a.n - b.n);
  const taken = new Set(existing.map((b) => b.id));
  const used = new Set(sorted.filter((b) => b.status !== 'planned').map((b) => b.n));
  const nextN = (): number => {
    let n = 1;
    while (used.has(n)) n++;
    used.add(n);
    return n;
  };

  const plan = (kind: 'grain' | 'mixed', count: number) => {
    const ex = sorted.filter((b) => b.kind === kind);
    const locked = ex.filter((b) => b.status !== 'planned');
    const planned = ex.filter((b) => b.status === 'planned');
    const keepCount = Math.max(0, count - locked.length);
    return {
      locked,
      keep: planned.slice(0, keepCount),
      remove: planned.slice(keepCount),
      add: Math.max(0, keepCount - planned.length),
    };
  };

  const g = plan('grain', want.grain);
  const m = plan('mixed', want.mixed);

  const upserts: { id: string; data: Bucket }[] = [];
  const plannedOut: Bucket[] = [];
  const idFor = (n: number): string => {
    const cand = `bucket-${n}`;
    const id = taken.has(cand) ? makeId('bucket') : cand;
    taken.add(id);
    return id;
  };

  const grainDays = kcalPerDay > 0 ? grainBucketKcal() / kcalPerDay : 0;
  const makeGrain = (n: number): Bucket => ({
    n,
    name: `Balde ${n}`,
    kind: 'grain',
    bags: GRAIN_BAGS,
    items: grainItems(),
    status: 'planned',
    cycle: 0,
    note: grainDays > 0 ? `Rende cerca de ${round(grainDays, 1).toLocaleString('pt-BR')} dias para a família.` : undefined,
  });
  const makeMixed = (n: number): Bucket => ({
    n,
    name: `Balde ${n} (misto)`,
    kind: 'mixed',
    bags: mixedBagsFor(want.mixedScale),
    items: scaledMixedItems(want.mixedScale),
    status: 'planned',
    cycle: 0,
    note: `Açúcar e sal vão sem absorvedor.${want.mixedScale < 0.95 ? ` Quantidades a ${Math.round(want.mixedScale * 100)}% do balde de exemplo.` : ''}`,
  });

  for (const b of g.keep) {
    const data = makeGrain(nextN());
    upserts.push({ id: b.id, data });
    plannedOut.push(data);
  }
  for (let i = 0; i < g.add; i++) {
    const data = makeGrain(nextN());
    upserts.push({ id: idFor(data.n), data });
    plannedOut.push(data);
  }
  for (const b of m.keep) {
    const data = makeMixed(nextN());
    upserts.push({ id: b.id, data });
    plannedOut.push(data);
  }
  for (let i = 0; i < m.add; i++) {
    const data = makeMixed(nextN());
    upserts.push({ id: idFor(data.n), data });
    plannedOut.push(data);
  }

  const lockedKcal = [...g.locked, ...m.locked].reduce((s, b) => s + bucketKcal(b), 0);
  const plannedKcal = plannedOut.reduce((s, b) => s + bucketKcal(b), 0);
  return {
    upserts,
    removeIds: [...g.remove, ...m.remove].map((b) => b.id),
    locked: { grain: g.locked.length, mixed: m.locked.length },
    over: { grain: Math.max(0, g.locked.length - want.grain), mixed: Math.max(0, m.locked.length - want.mixed) },
    after: { grain: g.locked.length + g.keep.length + g.add, mixed: m.locked.length + m.keep.length + m.add },
    planned: plannedOut,
    kcalAfter: lockedKcal + plannedKcal,
  };
}

/* ---------- Despensa ---------- */

const DECIMAL_UNITS = new Set(['kg', 'L']);

/** Escala o plano da despensa para `targetKcal`, mantendo a proporção entre os itens. "Tenho" não muda. */
export function scalePantry(items: { id: string; planQty: number; kcalPerUnit: number; unit: string }[], targetKcal: number): { id: string; planQty: number }[] {
  const current = items.reduce((s, i) => s + i.planQty * i.kcalPerUnit, 0);
  if (current <= 0) return [];
  const f = Math.max(0, targetKcal) / current;
  // Sempre arredonda para cima: o plano nunca fica abaixo da meta, e repetir a conta só pode diminuir ou manter.
  return items.map((i) => {
    const raw = i.planQty * f;
    const planQty = f === 0 ? 0 : DECIMAL_UNITS.has(i.unit) ? Math.max(0.1, Math.ceil(raw * 10 - 1e-9) / 10) : Math.max(1, Math.ceil(raw - 1e-9));
    return { id: i.id, planQty };
  });
}

/** Se o plano da despensa já cobre a meta com até esta sobra, não mexe (evita mudar por causa de arredondamento). */
export const PANTRY_TOLERANCE = 1.1;

/** Quanto o arredondamento para cima pode somar, no máximo: um passo (1 unidade, ou 0,1 kg/L) por item. */
export function pantrySlack(items: { kcalPerUnit: number; unit: string }[]): number {
  return items.reduce((s, i) => s + (DECIMAL_UNITS.has(i.unit) ? 0.1 : 1) * i.kcalPerUnit, 0);
}

/** Onde achar, no Costco, os itens do plano de exemplo. Aparece como dica na lista de compras da despensa. */
export const PANTRY_HINTS: Record<string, string> = {
  'Atum, sardinha e frango em lata': 'No Costco: frango Kirkland (6 × 12,5 oz) e atum albacore (8 × 7 oz). Sardinha em outras lojas.',
  'Pasta de amendoim': 'No Costco: Kirkland orgânica (2 × 28 oz).',
  'Carne seca': 'No Costco: Kirkland steak strips (12 oz). Refrigerar depois de aberta.',
  'Legumes, sopas e feijão em lata': 'No Costco: tomate picado Kirkland (8 × 14,5 oz) e caldo Swanson (12 × 14 oz). Feijão e sopa em outras lojas.',
  'Biscoito salgado (400 g)': 'No Costco: Kirkland Rice Crackers (32 oz).',
  'Barras de cereal ou proteína': 'No Costco: barras de proteína Kirkland (caixa 42).',
  'Óleo de cozinha': 'No Costco: óleo de canola Kirkland (galão 5 qt).',
};

/* ---------- Lista de compras (comida e embalagem) ---------- */

export interface ShopSeed extends Omit<ShopItem, 'order' | 'checked'> {
  auto: string;
}

interface Pack {
  key: string;
  name: string;
  unit: string;
  packLb: number;
  price: number;
  store: ShopItem['store'];
  note?: string;
}

/** Embalagens e preços do plano original (estimativas editáveis). A chave é o nome do item no balde. */
const FOOD_PACKS: Record<string, Pack> = {
  Arroz: { key: 'food:rice', name: 'Arroz branco grão longo (Kirkland ou Supreme)', unit: 'saco 25 lb', packLb: 25, price: 12, store: 'Costco' },
  Feijão: { key: 'food:beans', name: 'Feijão pinto (Rhodes Stockton)', unit: 'saco 25 lb', packLb: 25, price: 14.99, store: 'Costco' },
  'Macarrão quebrado': { key: 'food:pasta', name: 'Macarrão espaguete Barilla', unit: 'pacote 4 × 2 lb', packLb: 8, price: 9.49, store: 'Costco' },
  Lentilha: { key: 'food:lentils', name: 'Lentilha seca', unit: 'kg', packLb: 2.2046, price: 0, store: 'Outros' },
  Aveia: { key: 'food:oats', name: 'Aveia em flocos Kirkland', unit: 'saco 10 lb', packLb: 10, price: 7.99, store: 'Costco' },
  Açúcar: { key: 'food:sugar', name: 'Açúcar granulado', unit: 'saco 25 lb', packLb: 25, price: 16, store: 'Costco' },
  'Leite em pó': { key: 'food:milk', name: "Leite em pó desnatado Saco Mix'n Drink", unit: 'saco 8 lb', packLb: 8, price: 35.99, store: 'Costco', note: 'Visto só em algumas unidades: confirme na sua.' },
  'Café (em pote vedado, fora do balde)': { key: 'food:coffee', name: 'Café moído Kirkland', unit: 'saco 2,5 lb', packLb: 2.5, price: 17.99, store: 'Costco' },
};

/** Itens de compra que não dependem dos baldes: reforço de purificação de água. */
export function waterShopping(): ShopSeed[] {
  const out: ShopSeed[] = [];
  out.push({
    name: 'Pastilhas de purificação de água (Aquatabs 397 mg, frasco com 100)',
    qty: 1,
    unit: 'frasco',
    store: 'Outros',
    section: 'Água',
    note: 'Reforço se a água guardada acabar: 1 pastilha trata até 4 galões (cerca de 15 L) em 30 minutos, segundo o anúncio. Água turva: filtre antes. Não cobre Cryptosporidium. Validade no frasco.',
    auto: 'pkg:aquatabs',
  });
  return out;
}

/** Sacos de Mylar por balde e absorvedores: 1 por saco de grãos e 1 no leite do balde misto. */
export function foodShopping(planned: Bucket[]): ShopSeed[] {
  const kgBy = new Map<string, number>();
  for (const b of planned) for (const it of b.items) kgBy.set(it.name, (kgBy.get(it.name) ?? 0) + it.kg);

  const out: ShopSeed[] = [];
  for (const [name, pack] of Object.entries(FOOD_PACKS)) {
    const kg = kgBy.get(name);
    if (!kg || kg <= 0) continue;
    out.push({
      name: pack.name,
      qty: Math.max(1, Math.ceil(kg / (pack.packLb * LB_KG) - 1e-9)),
      unit: pack.unit,
      store: pack.store,
      section: 'Baldes',
      unitPrice: pack.price > 0 ? pack.price : undefined,
      note: pack.note,
      auto: pack.key,
    });
  }
  const salt = kgBy.get('Sal');
  if (salt && salt > 0) out.push({ name: 'Sal iodado', qty: round(Math.max(0.1, salt), 1), unit: 'kg', store: 'Outros', section: 'Baldes', auto: 'food:salt' });

  const nb = planned.length;
  if (nb > 0) {
    const bags = planned.reduce((s, b) => s + b.bags, 0);
    const o2 = planned.reduce((s, b) => s + (b.kind === 'grain' ? b.bags : 1), 0);
    out.push(
      { name: 'Baldes de 5 galões com tampa', qty: nb, unit: 'balde', store: 'Outros', section: 'Embalagem', note: "Home Depot, Lowe's ou Amazon.", auto: 'pkg:buckets' },
      { name: 'Sacos de Mylar de 2 galões (13×17 pol), 10 mil', qty: bags, unit: 'saco', store: 'Outros', section: 'Embalagem', note: 'O pacote com 60 cobre 27 sacos. Os 20 absorvedores que vêm nele não bastam: compre os de 700 cc abaixo.', auto: 'pkg:mylar' },
      { name: 'Absorvedores de oxigênio de 700 cc', qty: o2, unit: 'unidade', store: 'Outros', section: 'Embalagem', auto: 'pkg:o2' },
      { name: 'Tampa com rosca (Gamma Seal)', qty: Math.min(2, nb), unit: 'tampa', store: 'Outros', section: 'Embalagem', note: 'Para o balde em uso.', auto: 'pkg:gamma' },
      { name: 'Balança de cozinha (até 5 kg), funil grande e chapinha ou ferro de passar', qty: 1, unit: 'kit', store: 'Outros', section: 'Embalagem', auto: 'pkg:tools' },
      { name: 'Pote de vidro com tampa (absorvedores que sobrarem)', qty: 1, unit: 'pote', store: 'Outros', section: 'Embalagem', auto: 'pkg:jar' },
    );
  }
  return out;
}

/** Os itens de compra do plano de exemplo (shop-01 a shop-35) não tinham chave. Estes mapeiam para as chaves novas. */
const LEGACY_KEYS: Record<number, string> = {
  1: 'food:rice',
  2: 'food:beans',
  3: 'food:pasta',
  4: 'food:oats',
  5: 'food:sugar',
  6: 'food:milk',
  7: 'food:coffee',
  22: 'pkg:buckets',
  23: 'pkg:mylar',
  24: 'pkg:o2',
  25: 'pkg:gamma',
  26: 'pkg:tools',
  27: 'pkg:jar',
  28: 'food:salt',
};

/** Chave do item de compra: a que o plano gerou, a do plano de exemplo, ou `undefined` se o item é seu. */
export function shopKey(it: { id: string; auto?: string }): string | undefined {
  if (it.auto) return it.auto;
  const m = /^shop-(\d{2})$/.exec(it.id);
  if (!m) return undefined;
  const n = Number(m[1]);
  return LEGACY_KEYS[n] ?? `legacy:${m[1]}`;
}

export interface ShopChange {
  puts: { id: string; data: Omit<ShopItem, 'order'> & { order: number } }[];
  removeIds: string[];
}

/**
 * Refaz os itens de compra do plano. Itens marcados como comprados ficam e abatem a quantidade nova.
 * Itens seus (sem chave) ficam como estão. Itens não comprados do plano antigo são trocados pelos novos.
 */
export function regenerateShopping(existing: WithId<ShopItem>[], generated: ShopSeed[], makeId: (prefix: string) => string): ShopChange {
  const keyed = existing.map((e) => ({ e, key: shopKey(e) })).filter((x): x is { e: WithId<ShopItem>; key: string } => !!x.key);
  const bought = new Map<string, number>();
  for (const { e, key } of keyed) if (e.checked) bought.set(key, (bought.get(key) ?? 0) + e.qty);

  const taken = new Map(existing.map((e) => [e.id, e]));
  let order = existing.reduce((m, e) => Math.max(m, e.order), 0);
  const puts: ShopChange['puts'] = [];
  const reused = new Set<string>();

  for (const g of generated) {
    const qty = g.qty - (bought.get(g.auto) ?? 0);
    if (qty <= 0) continue;
    const base = `auto-${g.auto.replace(':', '-')}`;
    const clash = taken.get(base);
    const id = !clash ? base : !clash.checked ? base : makeId(base);
    if (clash && !clash.checked) reused.add(base);
    order += 1;
    puts.push({ id, data: { ...g, qty: Math.round(qty * 10) / 10, checked: false, order } });
  }

  const removeIds = keyed.filter(({ e }) => !e.checked && !reused.has(e.id)).map(({ e }) => e.id);
  return { puts, removeIds };
}

/* ---------- Tudo junto ---------- */

export function buildApply(s: ApplyState): ApplyPreview {
  const { plan } = s;
  const food = plan.food;
  const ops: Op[] = [];
  const lines: string[] = [];

  const rec = reconcileBuckets(s.buckets, { grain: food.grainBuckets, mixed: food.mixedBuckets, mixedScale: food.mixedScale }, plan.kcalPerDay, s.makeId);
  for (const u of rec.upserts) ops.push({ type: 'put', kind: 'bucket', id: u.id, data: u.data });
  for (const id of rec.removeIds) ops.push({ type: 'remove', id });

  const grainNow = s.buckets.filter((b) => b.kind === 'grain').length;
  const mixedNow = s.buckets.filter((b) => b.kind === 'mixed').length;
  if (food.strategy === 'pantry') {
    lines.push(L(`Comida: meta curta (${plan.days} dias). O plano usa comida pronta da despensa, sem baldes novos.`, `Food: short goal (${plan.days} days). The plan uses ready-to-eat pantry food, no new buckets.`));
  }
  lines.push(L(`Baldes de grãos: ${grainNow} → ${rec.after.grain}${rec.locked.grain > 0 ? ` (${rec.locked.grain} lacrados ou em rotação não mudam)` : ''}`, `Grain buckets: ${grainNow} → ${rec.after.grain}${rec.locked.grain > 0 ? ` (${rec.locked.grain} sealed or rotating stay unchanged)` : ''}`));
  lines.push(L(`Balde misto: ${mixedNow} → ${rec.after.mixed}${food.mixedBuckets > 0 && food.mixedScale < 0.95 ? ` (a ${Math.round(food.mixedScale * 100)}% das quantidades)` : ''}`, `Mixed bucket: ${mixedNow} → ${rec.after.mixed}${food.mixedBuckets > 0 && food.mixedScale < 0.95 ? ` (at ${Math.round(food.mixedScale * 100)}% of the quantities)` : ''}`));
  if (rec.over.grain > 0 || rec.over.mixed > 0) {
    lines.push(L(`Você já tem ${rec.over.grain + rec.over.mixed} balde(s) lacrado(s) além da meta: eles ficam, e a despensa pede menos.`, `You already have ${rec.over.grain + rec.over.mixed} sealed bucket(s) beyond the goal: they stay, and the pantry asks for less.`));
  }

  // A despensa cobre o que os baldes (com o conteúdo real dos lacrados) não cobrem.
  const need = food.needKcal;
  const floor = food.strategy === 'buckets' ? need * MIN_PANTRY_SHARE : 0;
  const pantryTarget = Math.max(floor, need - rec.kcalAfter);
  // Variedade: itens novos entram uma vez, junto com os que já existem, e tudo é escalado junto.
  let order = s.pantry.reduce((m, p) => Math.max(m, p.order), 0);
  const have = new Set(s.pantry.map((p) => p.name));
  const additions: WithId<PantryItem>[] = s.addVariety
    ? PANTRY_VARIETY.filter((v) => !have.has(v.name)).map((v) => ({ ...v, haveQty: 0, order: ++order, id: s.makeId('pantry') }))
    : [];
  const list = [...s.pantry, ...additions];
  const pantryNow = list.reduce((sum, p) => sum + p.planQty * p.kcalPerUnit, 0);
  const pantryOk = pantryNow >= pantryTarget - 1 && pantryNow <= pantryTarget * PANTRY_TOLERANCE + pantrySlack(list);
  const scaled = pantryOk ? [] : scalePantry(list, pantryTarget);
  const finalQty = (id: string, fallback: number) => scaled.find((x) => x.id === id)?.planQty ?? fallback;
  for (const a of additions) ops.push({ type: 'put', kind: 'pantry', id: a.id, data: { ...stripId(a), planQty: finalQty(a.id, a.planQty) } });
  for (const p of scaled) {
    const cur = s.pantry.find((x) => x.id === p.id);
    if (cur && cur.planQty !== p.planQty) ops.push({ type: 'put', kind: 'pantry', id: p.id, data: { ...stripId(cur), planQty: p.planQty } });
  }
  if (additions.length > 0) lines.push(L(`Variedade: entram na despensa ${additions.map((a) => a.name.split(' (')[0].toLowerCase()).join(' e ')}.`, `Variety: added to the pantry: ${additions.map((a) => tx(a.name).split(' (')[0].toLowerCase()).join(' and ')}.`));
  if (scaled.length > 0) {
    const pct = pantryNow > 0 ? Math.round((pantryTarget / pantryNow - 1) * 100) : 0;
    lines.push(L(`Despensa: ${Math.round(pantryTarget / 1000).toLocaleString('pt-BR')} mil kcal (${pct >= 0 ? '+' : ''}${pct}% sobre o plano atual). O que você já tem não muda.`, `Pantry: ${Math.round(pantryTarget / 1000).toLocaleString('en-US')}k kcal (${pct >= 0 ? '+' : ''}${pct}% over the current plan). What you already have does not change.`));
  } else {
    lines.push(L('Despensa: o plano atual já cobre a meta. Nada muda.', 'Pantry: the current plan already covers the goal. Nothing changes.'));
  }

  const waterTarget = Math.ceil(plan.waterGal);
  const gasTarget = plan.cylinders;
  if (waterTarget !== s.sup.waterTargetGal || gasTarget !== s.sup.propaneTarget) {
    ops.push({ type: 'put', kind: 'supply', id: 'supplies', data: { ...s.sup, waterTargetGal: waterTarget, propaneTarget: gasTarget } });
  }
  lines.push(L(`Água: meta de ${s.sup.waterTargetGal} → ${waterTarget} gal. Gás: ${s.sup.propaneTarget} → ${gasTarget} botijões de 20 lb.`, `Water: goal ${s.sup.waterTargetGal} → ${waterTarget} gal. Gas: ${s.sup.propaneTarget} → ${gasTarget} 20 lb cylinders.`));

  const change = regenerateShopping(s.shop, [...foodShopping(rec.planned), ...waterShopping()], s.makeId);
  for (const p of change.puts) ops.push({ type: 'put', kind: 'shop', id: p.id, data: p.data });
  for (const id of change.removeIds) ops.push({ type: 'remove', id });
  lines.push(L(`Lista de compras: ${change.removeIds.length} itens não comprados do plano antigo saem e ${change.puts.length} entram. O que você marcou como comprado e o que adicionou fica.`, `Shopping list: ${change.removeIds.length} unbought items from the old plan go out and ${change.puts.length} come in. What you marked as bought and what you added stays.`));

  return { ops, lines };
}

function stripId<T extends { id: string }>(x: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = x;
  return rest;
}

/**
 * Preço estimado por unidade da despensa, tirado da lista original do Costco (pacote ÷ unidades).
 * Estimativas editáveis do plano original, não leitura de preço de hoje. Itens que não estão aqui ficam sem preço.
 */
export const PANTRY_UNIT_PRICE: Record<string, number> = {
  'Atum, sardinha e frango em lata': 1.7,
  'Carne seca': 35,
  'Legumes, sopas e feijão em lata': 1.1,
  'Biscoito salgado (400 g)': 4.6,
  'Barras de cereal ou proteína': 0.35,
  'Óleo de cozinha': 2.4,
};

/** Preço estimado por unidade de itens das caixas (da lista original). */
export const GEAR_UNIT_PRICE: Record<string, number> = {
  'toilet-paper': 0.7,
  'trash-bags': 0.1,
};
