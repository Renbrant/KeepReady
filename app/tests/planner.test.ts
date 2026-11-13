import { describe, expect, it } from 'vitest';
import { CATALOG, up } from '../src/content/catalog';
import { buildApply, foodShopping, reconcileBuckets, regenerateShopping, scalePantry, shopKey, type ApplyState, type Op } from '../src/lib/apply';
import { bucketKcal } from '../src/lib/calc';
import { defaultSettings, seedRecords } from '../src/lib/plan';
import {
  MIN_PANTRY_SHARE,
  TOTE_LITERS,
  activeLines,
  computePlan,
  gearLines,
  gearProgress,
  grainBucketKcal,
  mixedBucketKcal,
  foodRations,
  packTotes,
  planFood,
} from '../src/lib/planner';
import type { Bucket, GearState, Member, PantryItem, Settings, ShopItem, Supplies } from '../src/lib/types';

const NOW = '2026-11-13T12:00:00.000Z';
const adult = (n: number, over: Partial<Member> = {}): Member => ({ name: `A${n}`, activity: 'moderate', kcalOverride: 2000, order: n, ...over });
const family = (n: number): Member[] => Array.from({ length: n }, (_, i) => adult(i + 1));
const settings = (over: Partial<Settings> = {}): Settings => ({ ...defaultSettings, ...over });
const ctx = (members: Member[], days: number) => ({ members, people: members.length, days });
const line = (members: Member[], days: number, id: string, recs: { id: string; state: GearState }[] = []) =>
  gearLines(ctx(members, days), recs).find((l) => l.id === id)!;

describe('planFood', () => {
  it('4 pessoas, 9.000 kcal/dia, 30 dias, 10% de folga: baldes inteiros e despensa absorvendo o resto', () => {
    const f = planFood({ kcalPerDay: 9000, days: 30, bufferPct: 10, mode: 'auto' });
    expect(f.strategy).toBe('buckets');
    expect(f.needKcal).toBeCloseTo(297000, 0);
    expect(f.grainBuckets).toBe(5);
    expect(f.mixedBuckets).toBe(1);
    expect(f.mixedScale).toBeGreaterThan(0.7);
    expect(f.mixedScale).toBeLessThan(1);
    expect(f.plannedKcal).toBeGreaterThanOrEqual(f.needKcal - 1);
    expect(f.coverDays).toBeGreaterThanOrEqual(33 - 1e-6);
    expect(f.pantryKcal).toBeGreaterThanOrEqual(f.needKcal * MIN_PANTRY_SHARE - 1);
  });

  it('meta de 7 dias no modo automático usa despensa pronta, sem baldes', () => {
    const f = planFood({ kcalPerDay: 9000, days: 7, bufferPct: 10, mode: 'auto' });
    expect(f.strategy).toBe('pantry');
    expect(f.grainBuckets).toBe(0);
    expect(f.mixedBuckets).toBe(0);
    expect(f.pantryKcal).toBeCloseTo(9000 * 7 * 1.1, 0);
  });

  it('meta de 7 dias no modo "sempre" calcula baldes e o balde misto sai reduzido', () => {
    const f = planFood({ kcalPerDay: 9000, days: 7, bufferPct: 10, mode: 'always' });
    expect(f.strategy).toBe('buckets');
    expect(f.grainBuckets).toBeGreaterThanOrEqual(1);
    expect(f.mixedBuckets === 0 || f.mixedScale < 1).toBe(true);
  });

  it('o limite entre meta curta e longa é 14 dias', () => {
    expect(planFood({ kcalPerDay: 8000, days: 14, bufferPct: 10, mode: 'auto' }).strategy).toBe('pantry');
    expect(planFood({ kcalPerDay: 8000, days: 15, bufferPct: 10, mode: 'auto' }).strategy).toBe('buckets');
  });

  it('nunca cobre menos que a meta com a folga, para qualquer tamanho de casa e de meta', () => {
    for (const kcal of [2000, 4200, 8000, 9000, 15000]) {
      for (const days of [1, 3, 7, 14, 15, 21, 30, 60, 90, 180, 365]) {
        for (const mode of ['auto', 'always'] as const) {
          const f = planFood({ kcalPerDay: kcal, days, bufferPct: 10, mode });
          expect(f.plannedKcal, `${kcal} kcal × ${days} d (${mode})`).toBeGreaterThanOrEqual(f.needKcal - 1);
        }
      }
    }
  });

  it('mais dias nunca pedem menos baldes de grãos', () => {
    let prev = 0;
    for (let d = 15; d <= 400; d += 5) {
      const g = planFood({ kcalPerDay: 9000, days: d, bufferPct: 10, mode: 'auto' }).grainBuckets;
      expect(g).toBeGreaterThanOrEqual(prev);
      prev = g;
    }
  });

  it('mais folga pede mais comida', () => {
    const a = planFood({ kcalPerDay: 9000, days: 30, bufferPct: 0, mode: 'auto' });
    const b = planFood({ kcalPerDay: 9000, days: 30, bufferPct: 50, mode: 'auto' });
    expect(b.needKcal).toBeCloseTo(a.needKcal * 1.5, 0);
    expect(b.plannedKcal).toBeGreaterThan(a.plannedKcal);
  });

  it('sem calorias ou sem dias, não pede nada e não quebra', () => {
    for (const [kcal, days] of [[0, 30], [9000, 0]] as const) {
      const f = planFood({ kcalPerDay: kcal, days, bufferPct: 10, mode: 'auto' });
      expect(f.needKcal).toBe(0);
      expect(f.grainBuckets).toBe(0);
      expect(Number.isFinite(f.coverDays)).toBe(true);
    }
  });

  it('o balde de exemplo bate com o plano original (37.225 kcal de grãos, 43.220 do misto)', () => {
    expect(grainBucketKcal()).toBeCloseTo(37225, 0);
    expect(mixedBucketKcal()).toBeCloseTo(43220, 0);
  });
});

describe('arredondamento', () => {
  it('up não deixa ruído de ponto flutuante virar a próxima unidade', () => {
    expect(up(4 * 30 * 0.4)).toBe(48);
    expect(up(48.0000001)).toBe(49);
    expect(up(0)).toBe(0);
  });
});

describe('caixas: quantidades por pessoa, dia e perfil', () => {
  const four = family(4);

  it('4 adultos, 30 dias: números do plano original', () => {
    expect(line(four, 30, 'toilet-paper').need).toBe(48);
    expect(line(four, 30, 'wipes').need).toBe(8);
    expect(line(four, 30, 'trash-bags').need).toBe(60);
    expect(line(four, 30, 'batteries-aa').need).toBe(36);
    expect(line(four, 30, 'sanitizer').need).toBe(2);
    expect(line(four, 30, 'soap').need).toBe(4);
    expect(line(four, 30, 'toothbrush').need).toBe(4);
    expect(line(four, 30, 'headlamp').need).toBe(4);
    expect(line(four, 30, 'radio').need).toBe(1);
    expect(line(four, 30, 'power-bank').need).toBe(2);
  });

  it('7 dias: tudo o que escala com os dias diminui, e itens fixos não mudam', () => {
    for (const id of ['toilet-paper', 'wipes', 'trash-bags', 'batteries-aa']) {
      expect(line(four, 7, id).need).toBeLessThan(line(four, 30, id).need);
    }
    expect(line(four, 7, 'toilet-paper').need).toBe(12);
    expect(line(four, 7, 'radio').need).toBe(line(four, 30, 'radio').need);
    expect(line(four, 7, 'first-aid').need).toBe(1);
  });

  it('mais pessoas pedem mais, em proporção', () => {
    expect(line(family(8), 30, 'toilet-paper').need).toBe(2 * line(four, 30, 'toilet-paper').need);
    expect(line(family(8), 30, 'headlamp').need).toBe(8);
    expect(line(family(1), 30, 'power-bank').need).toBe(2);
  });

  it('sem informar o sexo, absorventes não entram; mulher de 12 a 51 anos, sim', () => {
    expect(line(four, 30, 'feminine').need).toBe(0);
    expect(line(four, 30, 'feminine').na).toBe(true);
    const mixed = [adult(1, { sex: 'F', age: 35 }), adult(2, { sex: 'M', age: 38 }), adult(3, { sex: 'F', age: 8 }), adult(4, { sex: 'F', age: 60 })];
    expect(line(mixed, 30, 'feminine').need).toBe(up((20 / 28) * 30)); // só a de 35
  });

  it('fraldas seguem a idade: 8 por dia até 1 ano, 6 até 2, 5 até 3, nenhuma depois', () => {
    expect(line([adult(1, { age: 0 })], 10, 'diapers').need).toBe(80);
    expect(line([adult(1, { age: 1 })], 10, 'diapers').need).toBe(60);
    expect(line([adult(1, { age: 2 })], 10, 'diapers').need).toBe(50);
    expect(line([adult(1, { age: 3 })], 10, 'diapers').need).toBe(0);
    expect(line([adult(1)], 10, 'diapers').need).toBe(0);
  });

  it('remédio contínuo: dias da meta entre 7 e 30, só para quem marcou', () => {
    const ms = [adult(1, { takesMeds: true }), adult(2), adult(3, { takesMeds: true })];
    expect(line(ms, 3, 'meds-rx').need).toBe(14);
    expect(line(ms, 30, 'meds-rx').need).toBe(60);
    expect(line(ms, 90, 'meds-rx').need).toBe(60);
    expect(line(four, 30, 'meds-rx').need).toBe(0);
  });

  it('óculos só para quem usa; jogos só com criança de menos de 13 anos', () => {
    expect(line([adult(1, { glasses: true }), adult(2)], 30, 'glasses').need).toBe(1);
    expect(line(four, 30, 'games').need).toBe(0);
    expect(line([adult(1), adult(2, { age: 9 })], 30, 'games').need).toBe(1);
  });

  it('itens opcionais vêm ocultos e não entram na conta até o usuário ligar', () => {
    const l = line(four, 30, 'vitamins');
    expect(l.hidden).toBe(true);
    expect(activeLines(gearLines(ctx(four, 30), [])).some((x) => x.id === 'vitamins')).toBe(false);
    const on = gearLines(ctx(four, 30), [{ id: 'gear-vitamins', state: { have: 0, hidden: false } }]);
    expect(activeLines(on).some((x) => x.id === 'vitamins')).toBe(true);
  });

  it('o que falta é preciso menos o que tem, nunca negativo', () => {
    const recs = [{ id: 'gear-toilet-paper', state: { have: 20 } }, { id: 'gear-wipes', state: { have: 99 } }];
    expect(line(four, 30, 'toilet-paper', recs).missing).toBe(28);
    expect(line(four, 30, 'wipes', recs).missing).toBe(0);
  });

  it('item criado pelo usuário entra com a quantidade que ele definiu', () => {
    const recs = [{ id: 'gear-c-abc', state: { have: 1, custom: { name: 'Saco de cimento', category: 'ferramentas' as const, unit: 'un', need: 3, liters: 5, kg: 2 } } }];
    const l = gearLines(ctx(four, 30), recs).find((x) => x.custom)!;
    expect(l.id).toBe('c-abc');
    expect(l.need).toBe(3);
    expect(l.missing).toBe(2);
  });

  it('todo item do catálogo tem id único, quantidade finita e não negativa', () => {
    const ids = CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const days of [0, 1, 7, 30, 365]) {
      for (const n of [1, 2, 4, 9]) {
        for (const l of gearLines(ctx(family(n), days), [])) {
          expect(Number.isFinite(l.need), `${l.id}`).toBe(true);
          expect(l.need).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('progresso conta só itens ativos', () => {
    const lines = gearLines(ctx(four, 30), [{ id: 'gear-radio', state: { have: 1 } }]);
    const p = gearProgress(lines);
    expect(p.total).toBe(activeLines(lines).length);
    expect(p.done).toBeGreaterThanOrEqual(1);
  });
});

describe('packTotes', () => {
  const cap = 20;

  it('nenhuma caixa passa do volume nem do peso, e nenhuma unidade se perde', () => {
    for (const days of [7, 30, 90]) {
      const lines = activeLines(gearLines(ctx(family(4), days), []));
      const totes = packTotes(lines, { capKg: cap });
      const packed = new Map<string, number>();
      for (const t of totes) {
        expect(t.liters).toBeLessThanOrEqual(TOTE_LITERS * 0.8 + 1e-6);
        expect(t.kg).toBeLessThanOrEqual(cap + 1e-6);
        for (const l of t.lines) packed.set(l.id, (packed.get(l.id) ?? 0) + l.qty);
      }
      for (const l of lines.filter((x) => !x.outside)) expect(packed.get(l.id), `${l.id} @ ${days}d`).toBe(l.need);
      for (const l of lines.filter((x) => x.outside)) expect(packed.has(l.id)).toBe(false);
    }
  });

  it('mais dias pedem pelo menos tantas caixas; limite de peso menor também', () => {
    const count = (days: number, capKg: number) => packTotes(activeLines(gearLines(ctx(family(4), days), [])), { capKg }).length;
    expect(count(7, 20)).toBeGreaterThanOrEqual(1);
    expect(count(30, 20)).toBeGreaterThanOrEqual(count(7, 20));
    expect(count(90, 20)).toBeGreaterThanOrEqual(count(30, 20));
    expect(count(30, 10)).toBeGreaterThanOrEqual(count(30, 20));
  });

  it('uma casa de 7 dias cabe numa caixa só', () => {
    const totes = packTotes(activeLines(gearLines(ctx(family(2), 7), [])), { capKg: 20 });
    expect(totes.length).toBe(1);
  });

  it('sem itens, nenhuma caixa', () => {
    expect(packTotes([], { capKg: 20 })).toEqual([]);
  });

  it('item hoje oculto não entra nas caixas', () => {
    const lines = gearLines(ctx(family(2), 30), [{ id: 'gear-toilet-paper', state: { have: 0, hidden: true } }]);
    const totes = packTotes(lines, { capKg: 20 });
    expect(totes.flatMap((t) => t.lines).some((l) => l.id === 'toilet-paper')).toBe(false);
  });
});

describe('computePlan', () => {
  it('resultado completo para a família de teste', () => {
    const p = computePlan({ members: family(4), settings: settings(), gear: [] });
    expect(p.people).toBe(4);
    expect(p.kcalPerDay).toBe(8000);
    expect(p.food.grainBuckets).toBeGreaterThan(0);
    expect(p.totes.length).toBeGreaterThanOrEqual(1);
    expect(p.waterGal).toBeGreaterThan(0);
    expect(p.cylinders).toBeGreaterThan(0);
    expect(p.outside.length).toBeGreaterThan(0);
  });

  it('mudar a meta de 30 para 7 dias reduz comida, água, gás e caixas', () => {
    const long = computePlan({ members: family(4), settings: settings({ daysTarget: 30 }), gear: [] });
    const short = computePlan({ members: family(4), settings: settings({ daysTarget: 7 }), gear: [] });
    expect(short.food.needKcal).toBeLessThan(long.food.needKcal);
    expect(short.waterGal).toBeLessThan(long.waterGal);
    expect(short.cylinders).toBeLessThanOrEqual(long.cylinders);
    expect(short.totes.length).toBeLessThanOrEqual(long.totes.length);
  });

  it('avisa quando falta idade, sexo ou meta de calorias', () => {
    const p = computePlan({ members: [adult(1, { kcalOverride: null }), adult(2)], settings: settings(), gear: [] });
    expect(p.warnings.some((w) => w.includes('sem meta de calorias'))).toBe(true);
    const q = computePlan({ members: [adult(1)], settings: settings(), gear: [] });
    expect(q.warnings.some((w) => w.includes('Sem idade ou sexo'))).toBe(true);
  });

  it('avisa sobre bebê', () => {
    const p = computePlan({ members: [adult(1), adult(2, { age: 0, sex: 'M' })], settings: settings(), gear: [] });
    expect(p.warnings.some((w) => w.includes('Bebê'))).toBe(true);
  });
});

/* ---------- Aplicar ---------- */

type WithId<T> = T & { id: string };

function seedState(over: Partial<{ members: Member[]; settings: Settings }> = {}) {
  const recs = seedRecords(NOW);
  const of = <T>(kind: string) => recs.filter((r) => r.kind === kind).map((r) => ({ ...(r.data as object), id: r.id }) as WithId<T>);
  return {
    members: over.members ?? of<Member>('member'),
    settings: over.settings ?? (recs.find((r) => r.kind === 'settings')!.data as Settings),
    buckets: of<Bucket>('bucket'),
    pantry: of<PantryItem>('pantry'),
    shop: of<ShopItem>('shop'),
    sup: recs.find((r) => r.kind === 'supply')!.data as Supplies,
  };
}

let idCounter = 0;
const makeId = (p: string) => `${p}-t${++idCounter}`;

function toApplyState(s: ReturnType<typeof seedState>): ApplyState {
  const plan = computePlan({ members: s.members, settings: s.settings, gear: [] });
  return { plan, buckets: s.buckets, pantry: s.pantry, shop: s.shop, sup: s.sup, makeId };
}

/** Aplica as operações a uma cópia do estado, como o app faria. */
function applyOps(s: ReturnType<typeof seedState>, ops: Op[]) {
  const out = { ...s, buckets: [...s.buckets], pantry: [...s.pantry], shop: [...s.shop], sup: { ...s.sup } };
  const upsert = <T extends { id: string }>(arr: T[], id: string, data: object) => {
    const i = arr.findIndex((x) => x.id === id);
    const v = { ...(data as object), id } as T;
    if (i >= 0) arr[i] = v;
    else arr.push(v);
  };
  for (const op of ops) {
    if (op.type === 'remove') {
      out.buckets = out.buckets.filter((x) => x.id !== op.id);
      out.pantry = out.pantry.filter((x) => x.id !== op.id);
      out.shop = out.shop.filter((x) => x.id !== op.id);
    } else if (op.kind === 'bucket') upsert(out.buckets, op.id, op.data as object);
    else if (op.kind === 'pantry') upsert(out.pantry, op.id, op.data as object);
    else if (op.kind === 'shop') upsert(out.shop, op.id, op.data as object);
    else if (op.kind === 'supply') out.sup = op.data as Supplies;
  }
  return out;
}

describe('reconcileBuckets', () => {
  const sealed = (n: number, kind: Bucket['kind'] = 'grain'): WithId<Bucket> => ({
    id: `bucket-${n}`,
    n,
    name: `Balde ${n}`,
    kind,
    bags: 4,
    items: kind === 'grain' ? [{ name: 'Arroz', kg: 3.5, kcalPerKg: 3600 }] : [{ name: 'Açúcar', kg: 6, kcalPerKg: 3870 }],
    status: 'sealed',
    sealedOn: '2026-11-01',
    dueOn: '2028-11-01',
    cycle: 1,
  });

  it('nunca mexe em balde lacrado ou em rotação, mesmo que a meta peça menos', () => {
    const s = seedState();
    s.buckets[0] = sealed(1);
    s.buckets[1] = { ...sealed(2), status: 'rotating' };
    const r = reconcileBuckets(s.buckets, { grain: 1, mixed: 1, mixedScale: 1 }, 8000, makeId);
    expect(r.removeIds).not.toContain('bucket-1');
    expect(r.removeIds).not.toContain('bucket-2');
    expect(r.upserts.some((u) => u.id === 'bucket-1' || u.id === 'bucket-2')).toBe(false);
    expect(r.locked.grain).toBe(2);
    expect(r.over.grain).toBe(1);
    // os 4 planejados de grãos saem; o misto planejado fica
    expect(r.removeIds.length).toBe(4);
    expect(r.after.grain).toBe(2);
  });

  it('adiciona baldes planejados com números sem repetir os lacrados', () => {
    const s = seedState();
    s.buckets = [sealed(1), sealed(3)];
    const r = reconcileBuckets(s.buckets, { grain: 5, mixed: 0, mixedScale: 1 }, 8000, makeId);
    const ns = r.upserts.map((u) => u.data.n);
    expect(ns.sort()).toEqual([2, 4, 5]);
    expect(new Set(r.upserts.map((u) => u.id)).size).toBe(r.upserts.length);
    expect(r.upserts.every((u) => u.data.status === 'planned' && u.data.cycle === 0)).toBe(true);
  });

  it('o misto reduzido leva menos açúcar, leite e sacos', () => {
    const r = reconcileBuckets([], { grain: 0, mixed: 1, mixedScale: 0.5 }, 8000, makeId);
    const b = r.upserts[0].data;
    expect(b.kind).toBe('mixed');
    expect(b.items.find((i) => i.name === 'Açúcar')!.kg).toBeCloseTo(3, 2);
    expect(b.bags).toBe(2);
    expect(b.note).toContain('50%');
  });
});

describe('scalePantry', () => {
  const items = [
    { id: 'a', planQty: 80, kcalPerUnit: 150, unit: 'latas' },
    { id: 'b', planQty: 3, kcalPerUnit: 5900, unit: 'kg' },
  ];
  it('mantém a proporção e chega perto da meta de kcal', () => {
    const cur = 80 * 150 + 3 * 5900;
    const out = scalePantry(items, cur * 0.5);
    expect(out[0].planQty).toBe(40);
    expect(out[1].planQty).toBe(1.5);
  });
  it('latas sobem para o inteiro; kg com uma casa', () => {
    const out = scalePantry(items, (80 * 150 + 3 * 5900) * 0.333);
    expect(Number.isInteger(out[0].planQty)).toBe(true);
    expect(out[1].planQty).toBe(1);
  });
  it('meta zero zera o plano, sem dividir por zero', () => {
    expect(scalePantry(items, 0).every((x) => x.planQty === 0)).toBe(true);
    expect(scalePantry([{ id: 'x', planQty: 0, kcalPerUnit: 0, unit: 'un' }], 1000)).toEqual([]);
  });
});

describe('lista de compras do plano', () => {
  const planned = (n: number): Bucket => ({
    n,
    name: `Balde ${n}`,
    kind: 'grain',
    bags: 4,
    items: [
      { name: 'Arroz', kg: 3.5, kcalPerKg: 3600 },
      { name: 'Feijão', kg: 3.25, kcalPerKg: 3400 },
    ],
    status: 'planned',
    cycle: 0,
  });

  it('soma o arroz dos baldes planejados em sacos de 25 lb e conta a embalagem', () => {
    const items = foodShopping([1, 2, 3, 4, 5].map(planned));
    const rice = items.find((i) => i.auto === 'food:rice')!;
    expect(rice.qty).toBe(Math.ceil((5 * 3.5) / (25 * 0.45359237)));
    expect(items.find((i) => i.auto === 'pkg:buckets')!.qty).toBe(5);
    expect(items.find((i) => i.auto === 'pkg:mylar')!.qty).toBe(20);
    expect(items.find((i) => i.auto === 'pkg:o2')!.qty).toBe(20);
  });

  it('sem baldes planejados, não pede embalagem', () => {
    expect(foodShopping([]).length).toBe(0);
  });

  it('reconhece os itens do plano de exemplo pela chave e deixa os seus sem chave', () => {
    expect(shopKey({ id: 'shop-01' })).toBe('food:rice');
    expect(shopKey({ id: 'shop-22' })).toBe('pkg:buckets');
    expect(shopKey({ id: 'shop-08' })).toBe('legacy:08');
    expect(shopKey({ id: 'shop-ab12cd34' })).toBeUndefined();
    expect(shopKey({ id: 'x', auto: 'food:salt' })).toBe('food:salt');
  });

  it('abate o que já foi comprado, preserva itens seus e troca os não comprados', () => {
    const s = seedState();
    const shop: WithId<ShopItem>[] = s.shop.map((x) => (x.id === 'shop-01' ? { ...x, checked: true } : x)); // 2 sacos de arroz comprados
    shop.push({ id: 'shop-ab12cd34', name: 'Pilhas AA', qty: 1, unit: 'un.', store: 'Costco', section: 'Extras', checked: false, order: 999 });
    const gen = foodShopping([1, 2, 3, 4, 5, 6].map(planned));
    const rice = gen.find((g) => g.auto === 'food:rice')!;
    const ch = regenerateShopping(shop, gen, makeId);

    const newRice = ch.puts.find((p) => p.data.auto === 'food:rice');
    expect(newRice ? newRice.data.qty : 0).toBe(Math.max(0, rice.qty - 2));
    expect(ch.removeIds).not.toContain('shop-01'); // comprado: fica
    expect(ch.removeIds).not.toContain('shop-ab12cd34'); // seu: fica
    expect(ch.removeIds).toContain('shop-08'); // item antigo não comprado: sai
    expect(ch.puts.every((p) => !p.data.checked)).toBe(true);
  });

  it('refazer a lista duas vezes não duplica itens', () => {
    const s = seedState();
    const gen = foodShopping([1, 2, 3].map(planned));
    const first = regenerateShopping(s.shop, gen, makeId);
    const after: WithId<ShopItem>[] = s.shop.filter((x) => !first.removeIds.includes(x.id));
    for (const p of first.puts) after.push({ ...p.data, id: p.id });
    const second = regenerateShopping(after, gen, makeId);
    const finalIds = new Set(after.filter((x) => !second.removeIds.includes(x.id)).map((x) => x.id));
    for (const p of second.puts) finalIds.add(p.id);
    const autos = [...finalIds].filter((id) => id.startsWith('auto-'));
    expect(autos.length).toBe(gen.length);
  });
});

describe('buildApply (de ponta a ponta com os dados do plano de exemplo)', () => {
  it('30 dias com 10% de folga: ajusta baldes, despensa, água, gás e compras', () => {
    const s = seedState({ settings: settings({ daysTarget: 30 }) });
    const prev = buildApply(toApplyState(s));
    const next = applyOps(s, prev.ops);
    const grain = next.buckets.filter((b) => b.kind === 'grain').length;
    const mixed = next.buckets.filter((b) => b.kind === 'mixed').length;
    expect(grain).toBe(computePlan({ members: s.members, settings: s.settings, gear: [] }).food.grainBuckets);
    expect(mixed).toBe(1);
    expect(next.sup.waterTargetGal).toBe(Math.ceil(computePlan({ members: s.members, settings: s.settings, gear: [] }).waterGal));
    const ns = next.buckets.map((b) => b.n);
    expect(new Set(ns).size).toBe(ns.length);
    expect(next.shop.some((x) => x.auto === 'food:rice')).toBe(true);
    expect(prev.lines.length).toBeGreaterThan(3);
  });

  it('o plano aplicado cobre a meta com a folga', () => {
    const s = seedState({ settings: settings({ daysTarget: 30 }) });
    const plan = computePlan({ members: s.members, settings: s.settings, gear: [] });
    const next = applyOps(s, buildApply(toApplyState(s)).ops);
    const kcal = next.buckets.reduce((sum, b) => sum + bucketKcal(b), 0) + next.pantry.reduce((sum, p) => sum + p.planQty * p.kcalPerUnit, 0);
    expect(kcal / plan.kcalPerDay).toBeGreaterThanOrEqual(30 * 1.1 - 0.5);
  });

  it('aplicar duas vezes seguidas dá o mesmo resultado', () => {
    const s = seedState({ settings: settings({ daysTarget: 21 }) });
    const once = applyOps(s, buildApply(toApplyState(s)).ops);
    const twice = applyOps(once, buildApply(toApplyState(once)).ops);
    const norm = (st: typeof once) => ({
      buckets: st.buckets.map((b) => ({ n: b.n, kind: b.kind, kg: b.items.map((i) => i.kg) })).sort((a, b) => a.n - b.n),
      pantry: st.pantry.map((p) => [p.id, p.planQty]).sort(),
      sup: st.sup,
      shop: st.shop.map((x) => [x.auto ?? x.id, x.qty]).sort(),
    });
    const a = norm(once), b = norm(twice);
    for (const k of Object.keys(a) as (keyof typeof a)[]) expect(JSON.stringify(b[k]), String(k)).toBe(JSON.stringify(a[k]));
  });

  it('meta de 7 dias: sem baldes novos, despensa pronta e metas menores', () => {
    const s = seedState({ settings: settings({ daysTarget: 7 }) });
    const prev = buildApply(toApplyState(s));
    const next = applyOps(s, prev.ops);
    expect(next.buckets.filter((b) => b.status === 'planned').length).toBe(0);
    expect(next.sup.waterTargetGal).toBeLessThan(s.sup.waterTargetGal);
    const kcal = next.pantry.reduce((sum, p) => sum + p.planQty * p.kcalPerUnit, 0);
    expect(kcal / 9000).toBeGreaterThanOrEqual(0); // despensa positiva
    expect(next.pantry.some((p) => p.planQty > 0)).toBe(true);
    expect(prev.lines[0]).toContain('meta curta');
  });

  it('o que já foi lacrado e o que você já tem na despensa continuam intactos', () => {
    const s = seedState({ settings: settings({ daysTarget: 14 }) });
    s.buckets[0] = { ...s.buckets[0], status: 'sealed', sealedOn: '2026-11-01', dueOn: '2027-01-01', cycle: 1 };
    s.pantry[0] = { ...s.pantry[0], haveQty: 12, expiresOn: '2028-01-01' };
    const next = applyOps(s, buildApply(toApplyState(s)).ops);
    const kept = next.buckets.find((b) => b.id === s.buckets[0].id)!;
    expect(kept.status).toBe('sealed');
    expect(kept.sealedOn).toBe('2026-11-01');
    expect(kept.items).toEqual(s.buckets[0].items);
    const p = next.pantry.find((x) => x.id === s.pantry[0].id)!;
    expect(p.haveQty).toBe(12);
    expect(p.expiresOn).toBe('2028-01-01');
  });

  it('sem pessoas, não gera nada destrutivo além de zerar o plano e não quebra', () => {
    const s = seedState();
    s.members = [];
    expect(() => buildApply(toApplyState(s))).not.toThrow();
  });
});

describe('foodRations', () => {
  it('a soma por pessoa fica perto da meta de calorias por pessoa (até a folga e o arredondamento)', () => {
    const f = planFood({ kcalPerDay: 8000, days: 30, bufferPct: 10, mode: 'auto' });
    const r = foodRations(f, 4);
    expect(r.rows.length).toBeGreaterThan(5);
    expect(r.kcalPerPerson).toBeGreaterThan(1800);
    expect(r.kcalPerPerson).toBeLessThan(2300);
    expect(r.rows.find((x) => x.name === 'Arroz')!.amount).toBeGreaterThan(100);
  });
  it('meta curta: só despensa, sem arroz', () => {
    const r = foodRations(planFood({ kcalPerDay: 8000, days: 7, bufferPct: 10, mode: 'auto' }), 4);
    expect(r.rows.some((x) => x.name === 'Arroz')).toBe(false);
    expect(r.kcalPerPerson).toBeGreaterThan(1800);
  });
  it('sem pessoas, vazio', () => {
    expect(foodRations(planFood({ kcalPerDay: 0, days: 30, bufferPct: 10, mode: 'auto' }), 0).rows).toEqual([]);
  });
});
