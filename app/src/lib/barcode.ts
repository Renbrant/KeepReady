import type { StockLot } from './types';

/** Só os dígitos. */
export function normalizeBarcode(s: string): string {
  return s.replace(/\D/g, '');
}

/** Confere o dígito verificador GS1 (EAN-8, UPC-A de 12, EAN-13 e GTIN-14). */
export function isValidBarcode(raw: string): boolean {
  const c = normalizeBarcode(raw);
  if (![8, 12, 13, 14].includes(c.length)) return false;
  const digits = c.split('').map(Number);
  const check = digits.pop()!;
  let sum = 0;
  digits.reverse().forEach((d, i) => (sum += d * (i % 2 === 0 ? 3 : 1)));
  return (10 - (sum % 10)) % 10 === check;
}

export interface BarcodeInfo {
  found: boolean;
  name?: string;
  quantity?: string;
}

export class LookupError extends Error {}

type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

/**
 * Procura o produto no Open Food Facts (base aberta; a cobertura de produtos dos EUA é parcial).
 * Não traz validade nem preço. Lança LookupError se não der para consultar (sem internet, limite, erro).
 */
export async function lookupBarcode(raw: string, fetchFn: FetchLike = fetch as unknown as FetchLike, timeoutMs = 8000): Promise<BarcodeInfo> {
  const code = normalizeBarcode(raw);
  const first = await lookupOne(code, fetchFn, timeoutMs);
  // UPC-A de 12 dígitos: a base guarda muitos como EAN-13 com um zero na frente.
  if (!first.found && code.length === 12) return lookupOne(`0${code}`, fetchFn, timeoutMs);
  return first;
}

async function lookupOne(code: string, fetchFn: FetchLike, timeoutMs: number): Promise<BarcodeInfo> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchFn(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,quantity`, { signal: ctl.signal });
    if (res.status === 404) return { found: false };
    if (!res.ok) throw new LookupError(`status ${res.status}`);
    const body = (await res.json()) as { status?: number; product?: { product_name?: string; brands?: string; quantity?: string } };
    const p = body.product;
    if (body.status === 0 || !p) return { found: false };
    const product = (p.product_name ?? '').trim();
    const brand = (p.brands ?? '').split(',')[0].trim();
    if (!product && !brand) return { found: false };
    const name = brand && product && !product.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${product}` : product || brand;
    return { found: true, name, quantity: p.quantity?.trim() || undefined };
  } catch (e) {
    if (e instanceof LookupError) throw e;
    throw new LookupError(e instanceof Error ? e.message : 'network');
  } finally {
    clearTimeout(timer);
  }
}

/** Já registrou esse código antes? Vale mais que a consulta online: funciona sem internet e é o seu nome. */
export function findKnownByBarcode(lots: Pick<StockLot, 'barcode' | 'name' | 'unit' | 'storage'>[], raw: string): Pick<StockLot, 'name' | 'unit' | 'storage'> | undefined {
  const code = normalizeBarcode(raw);
  const hit = lots.find((l) => l.barcode && normalizeBarcode(l.barcode) === code);
  return hit ? { name: hit.name, unit: hit.unit, storage: hit.storage } : undefined;
}
