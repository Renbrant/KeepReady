import { describe, expect, it } from 'vitest';
import {
  CYLINDER_BTU,
  altitudeFactors,
  autonomy,
  bucketKcal,
  canStartRotation,
  cookingMinutesPerDay,
  cylindersNeeded,
  finishRotation,
  firstCycleDueOn,
  foodDays,
  gasBtuPerDay,
  gasDays,
  householdKcalPerDay,
  overlaps,
  projectSchedule,
  readinessScore,
  replacementCost,
  replacementShopping,
  rotationRows,
  nextDue,
  sealBucket,
  startRotation,
  stockKcal,
  waterDays,
  waterNeededGal,
} from '../src/lib/calc';
import { seedRecords, defaultSettings } from '../src/lib/plan';
import type { Bucket, Member, PantryItem, Settings, Supplies } from '../src/lib/types';

const recs = seedRecords('2026-11-13T00:00:00Z');
const members = recs.filter((r) => r.kind === 'member').map((r) => r.data as Member);
const buckets = recs.filter((r) => r.kind === 'bucket').map((r) => r.data as Bucket);
const pantry = recs.filter((r) => r.kind === 'pantry').map((r) => r.data as PantryItem);
const sea: Settings = { ...defaultSettings, altitudeFt: 0 };
const five: Settings = { ...defaultSettings, altitudeFt: 5000 };

describe('plano de 4 pessoas', () => {
  it('seis baldes de grãos têm 37.225 kcal e o misto 43.220', () => {
    expect(Math.round(bucketKcal(buckets[0]))).toBe(37325);
    expect(Math.round(bucketKcal(buckets[6]))).toBe(43220);
  });

  it('baldes somam 267.170 kcal e a despensa 94.870, total 362.040', () => {
    const planned = stockKcal(buckets, pantry).plannedKcal;
    expect(Math.round(planned)).toBe(362040);
    const bucketsOnly = buckets.reduce((s, b) => s + bucketKcal(b), 0);
    expect(Math.round(bucketsOnly)).toBe(267170);
  });

  it('meta da casa: 4 × 2.000 = 8.000 kcal/dia, e o plano completo dura ~45 dias', () => {
    const perDay = householdKcalPerDay(members);
    expect(perDay).toBe(8000);
    expect(foodDays(362040, perDay)).toBeCloseTo(45.26, 2);
  });
});

describe('estoque', () => {
  it('só balde lacrado conta; balde em rotação sai da conta', () => {
    const b1 = sealBucket(buckets[0], '2026-12-01', 24, 7);
    const b2 = startRotation(sealBucket(buckets[1], '2026-12-01', 24, 7), '2027-01-01');
    const s = stockKcal([b1, b2, buckets[2]], []);
    expect(Math.round(s.bucketsKcal)).toBe(37325);
  });

  it('despensa conta pelo que você tem, não pelo plano', () => {
    const p = pantry.map((i) => ({ ...i, haveQty: i.name.startsWith('Óleo') ? 3 : 0 }));
    expect(stockKcal([], p).pantryKcal).toBe(24000);
  });
});

describe('altitude', () => {
  it('a 5.000 pés: panela de pressão +15% (CSU), panela aberta +25% e água +15% (estimativas)', () => {
    const f = altitudeFactors(5000);
    expect(f.pressure).toBeCloseTo(1.15, 5);
    expect(f.open).toBeCloseTo(1.25, 5);
    expect(f.water).toBeCloseTo(1.15, 5);
  });

  it('abaixo de 2.000 pés não há ajuste', () => {
    const f = altitudeFactors(1000);
    expect(f).toEqual({ pressure: 1, open: 1, water: 1 });
  });

  it('gás a 5.000 pés com panela de pressão: 168,4 min/dia e ~842 mil BTU em 30 dias', () => {
    expect(cookingMinutesPerDay(8000, five)).toBeCloseTo(168.375, 3);
    expect(gasBtuPerDay(8000, five) * 30).toBeCloseTo(841875, 0);
  });

  it('gás a 5.000 pés sem panela de pressão: 268,1 min/dia e ~1,34 milhão de BTU', () => {
    const open: Settings = { ...five, cookingMode: 'open' };
    expect(cookingMinutesPerDay(8000, open)).toBeCloseTo(268.125, 3);
    expect(gasBtuPerDay(8000, open) * 30).toBeCloseTo(1340625, 0);
  });

  it('nível do mar reproduz o plano original: 142,5 min com pressão e 217,5 sem', () => {
    expect(cookingMinutesPerDay(8000, sea)).toBeCloseTo(142.5, 5);
    expect(cookingMinutesPerDay(8000, { ...sea, cookingMode: 'open' })).toBeCloseTo(217.5, 5);
  });

  it('3 botijões de 20 lb cobrem 30 dias com panela de pressão, mas não sem ela', () => {
    const sup: Supplies = { waterGal: 0, waterTargetGal: 190, propaneFull: 3, propaneTarget: 3 };
    expect(gasDays(sup, 8000, five)).toBeGreaterThan(30);
    expect(gasDays(sup, 8000, { ...five, cookingMode: 'open' })).toBeLessThan(30);
    // com 20% de folga: 3 com panela de pressão, 4 sem ela
    expect(cylindersNeeded(8000, five)).toBe(3);
    expect(cylindersNeeded(8000, { ...five, cookingMode: 'open' })).toBe(4);
    // sem folga, 2 botijões cobrem só o cenário com panela de pressão
    expect(cylindersNeeded(8000, five, 1)).toBe(2);
    expect(CYLINDER_BTU).toBe(430000);
  });
});

describe('água', () => {
  it('a 5.000 pés o plano pede ~188 galões em 30 dias', () => {
    const need = waterNeededGal(members, 8000, { ...five, drinkLPerPersonDay: 3.785411784 });
    expect(need).toBeGreaterThan(187);
    expect(need).toBeLessThan(189);
  });

  it('190 galões duram ~30 dias para 4 pessoas', () => {
    const sup: Supplies = { waterGal: 190, waterTargetGal: 190, propaneFull: 0, propaneTarget: 3 };
    const d = waterDays(sup, members, 8000, { ...five, drinkLPerPersonDay: 3.785411784 });
    expect(d).toBeGreaterThan(30);
    expect(d).toBeLessThan(31);
  });
});

describe('autonomia', () => {
  it('o menor pilar é o gargalo', () => {
    const a = autonomy(45, 30, 46);
    expect(a.limiting).toBe('water');
    expect(a.min).toBe(30);
  });

  it('prontidão é a média limitada a 100% por pilar', () => {
    expect(readinessScore(autonomy(60, 15, 30), 30)).toBe(83);
    expect(readinessScore(autonomy(0, 0, 0), 30)).toBe(0);
  });
});

describe('rotação, um balde por vez', () => {
  const T = 24;

  it('primeiro ciclo escalonado: balde n vence em n × T/7 meses; o último em T meses', () => {
    expect(firstCycleDueOn('2026-12-01', 7, 7, T)).toBe('2028-12-01');
    // 24 meses ÷ 7 = 3,43 meses = 104 dias depois de 1º/dez
    expect(firstCycleDueOn('2026-12-01', 1, 7, T)).toBe('2027-03-15');
  });

  it('lacrar marca ciclo 1; repor depois de rotacionar soma T meses a partir de hoje', () => {
    const sealed = sealBucket(buckets[0], '2026-12-01', T, 7);
    expect(sealed.status).toBe('sealed');
    expect(sealed.cycle).toBe(1);
    const rot = startRotation(sealed, '2027-03-06');
    expect(rot.status).toBe('rotating');
    const again = finishRotation(rot, '2027-04-05', T);
    expect(again.status).toBe('sealed');
    expect(again.cycle).toBe(2);
    expect(again.dueOn).toBe('2029-04-05');
  });

  it('não deixa abrir dois baldes ao mesmo tempo', () => {
    const a = startRotation(sealBucket(buckets[0], '2026-12-01', T, 7), '2027-03-06');
    const b = sealBucket(buckets[1], '2026-12-01', T, 7);
    const check = canStartRotation([a, b], 2);
    expect(check.ok).toBe(false);
    expect(canStartRotation([sealBucket(buckets[0], '2026-12-01', T, 7)], 1).ok).toBe(true);
    expect(canStartRotation(buckets, 1).ok).toBe(false); // ainda não lacrado
  });

  it('status por vencimento: ok, em breve (30 dias) e vencido', () => {
    const mk = (due: string): Bucket => ({ ...buckets[0], status: 'sealed', sealedOn: '2026-01-01', dueOn: due, cycle: 1 });
    const rows = rotationRows([mk('2027-01-20'), mk('2026-12-20'), mk('2026-11-01')], '2026-12-01');
    expect(rows.map((r) => r.status)).toEqual(['ok', 'soon', 'overdue']);
    expect(nextDue(rows)?.dueOn).toBe('2026-11-01');
  });

  it('calendário de 36 meses com todos lacrados hoje: um balde a cada ~3,4 meses, sem sobreposição', () => {
    const sealed = buckets.map((b) => sealBucket(b, '2026-12-01', T, 7));
    const ev = projectSchedule(sealed, T, '2026-12-01', 36);
    expect(ev.length).toBeGreaterThanOrEqual(10);
    expect(ev[0].n).toBe(1);
    expect(ev[6].n).toBe(7);
    // depois do balde 7 volta o balde 1 (ciclo seguinte)
    expect(ev[7].n).toBe(1);
    expect(overlaps(ev, 30)).toHaveLength(0);
  });

  it('se todos vencem no mesmo dia, a sobreposição é detectada', () => {
    const same = buckets.map((b) => ({ ...b, status: 'sealed' as const, sealedOn: '2026-12-01', dueOn: '2028-12-01', cycle: 1 }));
    const ev = projectSchedule(same, T, '2026-12-01', 30);
    expect(overlaps(ev, 30).length).toBeGreaterThan(0);
  });

  it('baldes não lacrados entram no calendário como hipotéticos', () => {
    const ev = projectSchedule(buckets, T, '2026-12-01', 12);
    expect(ev.every((e) => e.hypothetical || e.cycle > 1)).toBe(true);
  });
});

describe('custo de reposição', () => {
  it('balde de grãos custa ~US$ 15 em comida (preços do Costco; a lentilha ainda está sem preço)', () => {
    const c = replacementCost(buckets[0], defaultSettings);
    expect(c.food).toBeGreaterThan(14);
    expect(c.food).toBeLessThan(16);
    expect(c.missingPrice).toEqual(['Lentilha']);
  });

  it('embalagem entra pelo custo por saco', () => {
    const c = replacementCost(buckets[0], { ...defaultSettings, packagingCostPerBag: 2 });
    expect(c.packaging).toBe(8);
    expect(c.total).toBeCloseTo(c.food + 8, 5);
  });

  it('balde 7 avisa o item sem preço (sal)', () => {
    expect(replacementCost(buckets[6], defaultSettings).missingPrice).toEqual(['Sal']);
  });

  it('lista de compras da reposição vem em libras e marcada com o balde', () => {
    const items = replacementShopping(buckets[0], 100);
    expect(items).toHaveLength(5);
    expect(items[0].forBucket).toBe(1);
    expect(items[0].unit).toBe('lb');
    expect(items[0].qty).toBeCloseTo(7.7, 1);
    expect(items[0].store).toBe('Reposição');
  });
});
