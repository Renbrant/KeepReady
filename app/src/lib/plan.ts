import type { Bucket, BucketItem, Member, PantryItem, Rec, Settings, ShopItem, Supplies } from './types';
import { GAL_L, LB_KG } from './calc';

/** Preços do plano original (Costco, US$ por libra). São estimativas editáveis, não uma leitura de preço de hoje. */
export const perKg = (usd: number, lb: number) => usd / (lb * LB_KG);

export const RICE: BucketItem = { name: 'Arroz', kg: 3.5, kcalPerKg: 3600, waterLPerKg: 2.2, pricePerKg: perKg(12, 25) };
export const BEANS: BucketItem = { name: 'Feijão', kg: 3.25, kcalPerKg: 3400, waterLPerKg: 4, pricePerKg: perKg(14.99, 25) };
export const PASTA: BucketItem = { name: 'Macarrão quebrado', kg: 2.25, kcalPerKg: 3500, waterLPerKg: 4, pricePerKg: perKg(9.49, 8) };
export const OATS: BucketItem = { name: 'Aveia', kg: 1.5, kcalPerKg: 3800, waterLPerKg: 5, pricePerKg: perKg(7.99, 10) };

export const defaultSettings: Settings = {
  householdName: 'Minha casa',
  daysTarget: 30,
  rotationMonths: 24,
  rotationWindowDays: 30,
  altitudeFt: 5300,
  cookingMode: 'pressure',
  drinkLPerPersonDay: Math.round(GAL_L * 100) / 100,
  packagingCostPerBag: 0,
  bufferPct: 10,
  bucketMode: 'auto',
  toteCapKg: 20,
  planConfigured: false,
  theme: 'auto',
};

const SCHEDULE_NOTE = [
  'Dias 1 a 5 do cronograma (com o balde 7)',
  'Dias 6 a 10',
  'Dias 11 a 15',
  'Dias 16 a 20',
  'Dias 21 a 25',
  'Dias 26 a 30',
];

/** Sacos de Mylar por balde de grãos e por balde misto, no plano de exemplo. */
export const GRAIN_BAGS = 4;
export const MIXED_BAGS = 3;

/** Itens de um balde de grãos (5 dias para 4 pessoas no plano de exemplo). */
export const grainItems = (): BucketItem[] => [RICE, BEANS, PASTA, OATS].map((i) => ({ ...i }));

/** Itens do balde misto do plano de exemplo. */
export const mixedItems = (): BucketItem[] => [
  { name: 'Açúcar', kg: 6, kcalPerKg: 3870, pricePerKg: perKg(16, 25) },
  { name: 'Leite em pó', kg: 4, kcalPerKg: 5000, pricePerKg: perKg(35.99, 8) },
  { name: 'Sal', kg: 1.2, kcalPerKg: 0 },
  { name: 'Café (em pote vedado, fora do balde)', kg: 1.2, kcalPerKg: 0, pricePerKg: perKg(17.99, 2.5) },
];

function grainBuckets(): Bucket[] {
  return [1, 2, 3, 4, 5, 6].map((n) => ({
    n,
    name: `Balde ${n}`,
    kind: 'grain' as const,
    bags: GRAIN_BAGS,
    items: grainItems(),
    status: 'planned' as const,
    cycle: 0,
    note: SCHEDULE_NOTE[n - 1],
  }));
}

function mixedBucket(): Bucket {
  return {
    n: 7,
    name: 'Balde 7 (misto)',
    kind: 'mixed',
    bags: MIXED_BAGS,
    items: mixedItems(),
    status: 'planned',
    cycle: 0,
    note: 'Aberto junto com o balde 1. Açúcar e sal vão sem absorvedor.',
  };
}

export const PANTRY: Omit<PantryItem, 'order' | 'haveQty'>[] = [
  { name: 'Atum, sardinha e frango em lata', unit: 'latas', planQty: 80, kcalPerUnit: 150 },
  { name: 'Pasta de amendoim', unit: 'kg', planQty: 3, kcalPerUnit: 5900 },
  { name: 'Carne seca', unit: 'kg', planQty: 1.5, kcalPerUnit: 4100 },
  { name: 'Legumes, sopas e feijão em lata', unit: 'latas', planQty: 54, kcalPerUnit: 150 },
  { name: 'Biscoito salgado (400 g)', unit: 'pacotes', planQty: 11, kcalPerUnit: 1720 },
  { name: 'Barras de cereal ou proteína', unit: 'barras', planQty: 40, kcalPerUnit: 200 },
  { name: 'Óleo de cozinha', unit: 'L', planQty: 3, kcalPerUnit: 8000 },
];

type ShopSeed = Omit<ShopItem, 'order' | 'checked'>;

const SHOP: ShopSeed[] = [
  { name: 'Arroz branco grão longo (Kirkland ou Supreme)', qty: 2, unit: 'saco 25 lb', store: 'Costco', section: 'Baldes', unitPrice: 12 },
  { name: 'Feijão pinto (Rhodes Stockton)', qty: 2, unit: 'saco 25 lb', store: 'Costco', section: 'Baldes', unitPrice: 14.99 },
  { name: 'Macarrão espaguete Barilla', qty: 4, unit: 'pacote 4 × 2 lb', store: 'Costco', section: 'Baldes', unitPrice: 9.49 },
  { name: 'Aveia em flocos Kirkland', qty: 2, unit: 'saco 10 lb', store: 'Costco', section: 'Baldes', unitPrice: 7.99 },
  { name: 'Açúcar granulado', qty: 1, unit: 'saco 25 lb', store: 'Costco', section: 'Baldes', unitPrice: 16 },
  { name: "Leite em pó desnatado Saco Mix'n Drink", qty: 1, unit: 'saco 8 lb', store: 'Costco', section: 'Baldes', unitPrice: 35.99, note: 'Visto só em algumas unidades: confirme na sua.' },
  { name: 'Café moído Kirkland', qty: 1, unit: 'saco 2,5 lb', store: 'Costco', section: 'Baldes', unitPrice: 17.99 },
  { name: 'Frango em lata Kirkland', qty: 3, unit: 'pacote 6 × 12,5 oz', store: 'Costco', section: 'Despensa', unitPrice: 9.99 },
  { name: 'Atum albacore Kirkland', qty: 4, unit: 'pacote 8 × 7 oz', store: 'Costco', section: 'Despensa', unitPrice: 13.49 },
  { name: 'Pasta de amendoim Kirkland orgânica', qty: 2, unit: 'pacote 2 × 28 oz', store: 'Costco', section: 'Despensa', note: 'Preço não confirmado.' },
  { name: 'Carne seca Kirkland (steak strips)', qty: 4, unit: 'pacote 12 oz', store: 'Costco', section: 'Despensa', unitPrice: 11.99, note: 'Refrigerar depois de aberta.' },
  { name: 'Tomate picado orgânico Kirkland', qty: 2, unit: 'pacote 8 × 14,5 oz', store: 'Costco', section: 'Despensa', unitPrice: 8.79 },
  { name: 'Caldo de galinha Swanson', qty: 1, unit: 'pacote 12 × 14 oz', store: 'Costco', section: 'Despensa', unitPrice: 8.99 },
  { name: 'Barras de proteína Kirkland', qty: 1, unit: 'caixa 42', store: 'Costco', section: 'Despensa', unitPrice: 14.79 },
  { name: 'Biscoito Kirkland Rice Crackers', qty: 5, unit: 'pacote 32 oz', store: 'Costco', section: 'Despensa', unitPrice: 10.39 },
  { name: 'Óleo de canola Kirkland', qty: 1, unit: 'galão 5 qt', store: 'Costco', section: 'Despensa', unitPrice: 11.49 },
  { name: 'Papel higiênico Kirkland', qty: 2, unit: 'pacote 30 rolos', store: 'Costco', section: 'Higiene', unitPrice: 21, note: 'O plano pede 48 rolos.' },
  { name: 'Sacos de lixo Kirkland 13 gal', qty: 1, unit: 'caixa 200', store: 'Costco', section: 'Higiene', unitPrice: 20.42 },
  { name: 'Lenços umedecidos Kirkland', qty: 1, unit: 'caixa', store: 'Costco', section: 'Higiene', note: 'Preço não confirmado. O plano pede 8 pacotes.' },
  { name: 'Botijão de propano 20 lb vazio (Flame King)', qty: 3, unit: 'botijão', store: 'Costco', section: 'Gás', note: 'O Costco enche, mas não troca. Confirme se a sua unidade enche.' },
  { name: 'Encher propano', qty: 3, unit: 'enchimento 20 lb', store: 'Costco', section: 'Gás', note: 'Cerca de US$ 13 a 18 cada (guia de terceiros).' },
  { name: 'Baldes de 5 galões com tampa', qty: 7, unit: 'balde', store: 'Outros', section: 'Embalagem', note: 'Home Depot, Lowe\'s ou Amazon.' },
  { name: 'Sacos de Mylar de 1,5 a 2 galões, 5 a 7 mil', qty: 27, unit: 'saco', store: 'Outros', section: 'Embalagem', note: '7 mil no macarrão.' },
  { name: 'Absorvedores de oxigênio de 500 cc', qty: 25, unit: 'unidade', store: 'Outros', section: 'Embalagem' },
  { name: 'Tampa com rosca (Gamma Seal)', qty: 2, unit: 'tampa', store: 'Outros', section: 'Embalagem', note: 'Para o balde em uso.' },
  { name: 'Balança de cozinha (até 5 kg), funil grande e chapinha ou ferro de passar', qty: 1, unit: 'kit', store: 'Outros', section: 'Embalagem' },
  { name: 'Pote de vidro com tampa (absorvedores que sobrarem)', qty: 1, unit: 'pote', store: 'Outros', section: 'Embalagem' },
  { name: 'Sal iodado', qty: 1.2, unit: 'kg', store: 'Outros', section: 'Baldes' },
  { name: 'Feijão, legumes e sopa em lata', qty: 54, unit: 'latas', store: 'Outros', section: 'Despensa', note: 'Não achei no Costco.' },
  { name: 'Álcool em gel 500 ml', qty: 3, unit: 'frasco', store: 'Outros', section: 'Higiene' },
  { name: 'Multivitamínico', qty: 120, unit: 'comprimidos', store: 'Outros', section: 'Higiene' },
  { name: 'Panela de pressão de fogão, 8 L', qty: 1, unit: 'panela', store: 'Outros', section: 'Cozinha', note: 'Obrigatória em altitude. Elétrica não serve sem luz.' },
  { name: 'Fogareiro de propano', qty: 1, unit: 'fogareiro', store: 'Outros', section: 'Cozinha' },
  { name: 'Água: tambores de 55 gal e garrafões de 5 gal', qty: 190, unit: 'galões', store: 'Outros', section: 'Água', note: '3 tambores de 55 gal e 5 garrafões de 5 gal.' },
  { name: 'Abridores de lata manuais, isqueiros, panelas com tampa e temperos', qty: 1, unit: 'kit', store: 'Outros', section: 'Cozinha' },
];

export function seedRecords(now: string): Rec[] {
  const recs: Rec[] = [];
  let rev = 1;
  const add = (kind: Rec['kind'], id: string, data: unknown) => recs.push({ id, kind, data, updatedAt: now, dirty: true, rev: rev++ });

  add('settings', 'settings', { ...defaultSettings });
  for (let i = 1; i <= 4; i++) {
    const m: Member = { name: `Adulto ${i}`, activity: 'moderate', kcalOverride: 2000, order: i };
    add('member', `member-${i}`, m);
  }
  [...grainBuckets(), mixedBucket()].forEach((b) => add('bucket', `bucket-${b.n}`, b));
  PANTRY.forEach((p, i) => add('pantry', `pantry-${i + 1}`, { ...p, haveQty: 0, order: i }));
  SHOP.forEach((s, i) => add('shop', `shop-${String(i + 1).padStart(2, '0')}`, { ...s, checked: false, order: i }));
  const sup: Supplies = { waterGal: 0, waterTargetGal: 190, propaneFull: 0, propaneTarget: 3 };
  add('supply', 'supplies', sup);
  return recs;
}
