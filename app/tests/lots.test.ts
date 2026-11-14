import { describe, expect, it } from 'vitest';
import { setLang } from '../src/lib/i18n';
import { childLabel, consumeLot, expiringLots, labelText, lotStatus, matchPantry, nextLabelBase, partLabel, splitLot, splitQuantities } from '../src/lib/lots';
import { suggestStorage } from '../src/content/storage';
import { findKnownByBarcode, isValidBarcode, lookupBarcode, LookupError, normalizeBarcode } from '../src/lib/barcode';
import { PANTRY } from '../src/lib/plan';
import type { PantryItem, StockLot } from '../src/lib/types';

setLang('pt');

const lot = (o: Partial<StockLot> = {}): StockLot => ({ name: 'Arroz', qty: 10, unit: 'lb', storage: 'mylar_o2', order: 1, ...o });

describe('etiquetas', () => {
  it('próximo número vem do maior já usado, contando 12a como 12', () => {
    expect(nextLabelBase([])).toBe(1);
    expect(nextLabelBase([{ label: '3' }, { label: '12a' }, { label: '12b' }, { label: undefined }, { label: 'X' }])).toBe(13);
  });
  it('partes: a, b, c... e depois numera', () => {
    expect(partLabel('12', 0)).toBe('12a');
    expect(partLabel('12', 2)).toBe('12c');
    expect(partLabel('12', 26)).toBe('12-27');
    expect(childLabel('12', 1)).toBe('12b');
    expect(childLabel('12a', 0)).toBe('12a.1'); // já é parte: não repete as irmãs
    expect(childLabel('X', 1)).toBe('X.2');
  });
  it('texto para a caneta: código e mês/ano', () => {
    expect(labelText({ label: '12a', expiresOn: '2028-03-15' })).toBe('12a · 03/2028');
    expect(labelText({ label: '7' })).toBe('7');
    expect(labelText({ expiresOn: '2027-11-01' })).toBe('11/2027');
  });
});

describe('desmembrar', () => {
  it('divide em partes iguais e a soma é a original', () => {
    expect(splitQuantities(25, 4)).toEqual([6.2, 6.2, 6.2, 6.4]);
    expect(splitQuantities(25, 4).reduce((a, b) => a + b, 0)).toBeCloseTo(25, 5);
    expect(splitQuantities(10, 1)).toEqual([10]);
    expect(splitQuantities(3, 0)).toEqual([3]);
  });
  it('cria os filhos com etiqueta própria, herda dados e remove o pai', () => {
    const parent = { ...lot({ qty: 25, expiresOn: '2030-01-01', label: '5', barcode: '0123' }), id: 'lot-1' };
    let n = 0;
    const r = splitLot(parent, [{ qty: 12.5 }, { qty: 12.5, expiresOn: '2029-06-01' }], '5', () => `lot-n${++n}`, 10);
    expect(r.removeId).toBe('lot-1');
    expect(r.puts.map((p) => p.id)).toEqual(['lot-n1', 'lot-n2']);
    expect(r.puts.map((p) => p.data.label)).toEqual(['5a', '5b']);
    expect(r.puts.map((p) => p.data.qty)).toEqual([12.5, 12.5]);
    expect(r.puts[0].data.expiresOn).toBe('2030-01-01');
    expect(r.puts[1].data.expiresOn).toBe('2029-06-01');
    expect(r.puts[0].data.splitFrom).toBe('5');
    expect(r.puts[0].data.barcode).toBe('0123');
    expect(r.puts.map((p) => p.data.order)).toEqual([10, 11]);
    expect('id' in r.puts[0].data).toBe(false);
  });
});

describe('consumo e validade', () => {
  it('consome parte, tudo e mais que o que tem', () => {
    expect(consumeLot(lot({ qty: 10 }), 3)).toEqual({ lot: lot({ qty: 7 }), used: 3 });
    expect(consumeLot(lot({ qty: 10 }), 10)).toEqual({ lot: null, used: 10 });
    expect(consumeLot(lot({ qty: 4 }), 9)).toEqual({ lot: null, used: 4 });
    expect(consumeLot(lot({ qty: 4 }), -2).used).toBe(0);
  });
  it('estado pela validade', () => {
    expect(lotStatus({}, '2026-11-13').tone).toBe('neutral');
    expect(lotStatus({ expiresOn: '2026-11-01' }, '2026-11-13')).toEqual({ tone: 'bad', days: -12 });
    expect(lotStatus({ expiresOn: '2026-12-13' }, '2026-11-13').tone).toBe('warn');
    expect(lotStatus({ expiresOn: '2027-11-13' }, '2026-11-13').tone).toBe('ok');
  });
  it('vencendo: só com quantidade, ordenado, até o prazo', () => {
    const ls = [
      lot({ name: 'c', expiresOn: '2027-12-01' }),
      lot({ name: 'a', expiresOn: '2026-12-01' }),
      lot({ name: 'b', expiresOn: '2026-10-01' }),
      lot({ name: 'zero', qty: 0, expiresOn: '2026-10-01' }),
      lot({ name: 'sem' }),
    ];
    expect(expiringLots(ls, '2026-11-13', 90).map((l) => l.name)).toEqual(['b', 'a']);
  });
});

describe('sugestão de armazenagem', () => {
  it.each([
    ['Arroz branco 25 lb', 'mylar_o2'],
    ['Kirkland Long Grain Rice', 'mylar_o2'],
    ['Feijão preto', 'mylar_o2'],
    ['Powdered milk', 'mylar_o2'],
    ['Café moído', 'mylar_o2'],
    ['Açúcar', 'mylar'],
    ['Sal iodado', 'mylar'],
    ['Salt', 'mylar'],
    ['Atum albacore', 'cans'],
    ['Kirkland Chicken Breast Canned', 'cans'],
    ['Campbell soup', 'cans'],
    ['Peanut butter', 'cool_dark'],
    ['Óleo de canola', 'cool_dark'],
    ['Papel higiênico', 'tote'],
    ['AA batteries', 'tote'],
    ['Rice Crackers', 'dry_pack'],
    ['Protein bars', 'dry_pack'],
    ['Beef jerky', 'dry_pack'],
    ['Coisa estranha', 'other'],
  ])('%s -> %s', (name, key) => {
    expect(suggestStorage(name)).toBe(key);
  });
});

describe('ligação com a despensa', () => {
  const pantry = PANTRY.map((p, i) => ({ ...p, haveQty: 0, order: i, id: `p${i}` })) as (PantryItem & { id: string })[];
  it('acha o item pelo nome em português ou inglês', () => {
    expect(matchPantry('Atum albacore Kirkland', pantry)).toBe('p0');
    expect(matchPantry('Kirkland Tuna', pantry)).toBe('p0');
    expect(matchPantry('Peanut butter organic', pantry)).toBe('p1');
    expect(matchPantry('Beef jerky', pantry)).toBe('p2');
    expect(matchPantry('Rice crackers', pantry)).toBe('p4');
    expect(matchPantry('canola oil', pantry)).toBe('p6');
  });
  it('sem combinação devolve nada', () => {
    expect(matchPantry('Lanterna', pantry)).toBeUndefined();
    expect(matchPantry('', pantry)).toBeUndefined();
  });
});

describe('código de barras', () => {
  it('confere o dígito verificador', () => {
    expect(isValidBarcode('4006381333931')).toBe(true); // EAN-13
    expect(isValidBarcode('036000291452')).toBe(true); // UPC-A
    expect(isValidBarcode('96385074')).toBe(true); // EAN-8
    expect(isValidBarcode('4006381333932')).toBe(false);
    expect(isValidBarcode('1234')).toBe(false);
    expect(isValidBarcode('0 36000-291452')).toBe(true);
  });
  it('normaliza', () => expect(normalizeBarcode(' 0360 00-291452 ')).toBe('036000291452'));

  const ok = (json: unknown, status = 200) => async () => ({ ok: status < 400, status, json: async () => json });
  it('lê nome, marca e quantidade', async () => {
    const r = await lookupBarcode('036000291452', ok({ status: 1, product: { product_name: 'Rice Crackers', brands: 'Kirkland Signature, Other', quantity: '32 oz' } }));
    expect(r).toEqual({ found: true, name: 'Kirkland Signature Rice Crackers', quantity: '32 oz' });
  });
  it('não repete a marca se já está no nome', async () => {
    const r = await lookupBarcode('036000291452', ok({ status: 1, product: { product_name: 'Barilla Spaghetti', brands: 'Barilla' } }));
    expect(r.name).toBe('Barilla Spaghetti');
  });
  it('não achou: 404, status 0 ou produto vazio', async () => {
    expect(await lookupBarcode('036000291452', ok({}, 404))).toEqual({ found: false });
    expect(await lookupBarcode('036000291452', ok({ status: 0 }))).toEqual({ found: false });
    expect(await lookupBarcode('036000291452', ok({ status: 1, product: {} }))).toEqual({ found: false });
  });
  it('erro de rede ou do servidor vira LookupError', async () => {
    await expect(lookupBarcode('036000291452', ok({}, 500))).rejects.toBeInstanceOf(LookupError);
    await expect(lookupBarcode('036000291452', async () => { throw new TypeError('Failed to fetch'); })).rejects.toBeInstanceOf(LookupError);
  });
  it('consulta o endereço certo, só com os dígitos', async () => {
    let url = '';
    await lookupBarcode('0360-00291452', async (u) => { url ||= u; return { ok: true, status: 200, json: async () => ({ status: 0 }) }; });
    expect(url).toBe('https://world.openfoodfacts.org/api/v2/product/036000291452.json?fields=product_name,brands,quantity');
  });
  it('UPC-A de 12 dígitos: se não achar, tenta com um zero na frente', async () => {
    const urls: string[] = [];
    const f = async (u: string) => {
      urls.push(u);
      return u.includes('/0036000291452') ? { ok: true, status: 200, json: async () => ({ status: 1, product: { product_name: 'Achei' } }) } : { ok: true, status: 200, json: async () => ({ status: 0 }) };
    };
    const r = await lookupBarcode('036000291452', f);
    expect(r.name).toBe('Achei');
    expect(urls.length).toBe(2);
  });
  it('lembra o que você já registrou com esse código', () => {
    const lots = [{ name: 'Meu arroz', unit: 'lb', storage: 'mylar_o2' as const, barcode: '036000291452' }, { name: 'x', unit: 'un', storage: 'other' as const }];
    expect(findKnownByBarcode(lots, '0360 00291452')).toEqual({ name: 'Meu arroz', unit: 'lb', storage: 'mylar_o2' });
    expect(findKnownByBarcode(lots, '4006381333931')).toBeUndefined();
  });
});

describe('sugestão: casos que dependem da ordem', () => {
  it.each([
    ['Atum em óleo', 'cans'],
    ['Feijão preto em lata', 'cans'],
    ['Canned beans', 'cans'],
    ['Sabonete em barra', 'tote'],
    ['Pasta de amendoim', 'cool_dark'],
  ])('%s -> %s', (name, key) => expect(suggestStorage(name)).toBe(key));
});
