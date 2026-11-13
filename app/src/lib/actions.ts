import { newId } from './store';
import { store } from './db';
import { replacementShopping } from './calc';
import type { Bucket, ShopItem } from './types';

/** Cria os itens de compra para repor um balde (uma vez só por balde). */
export function addReplacementShopping(b: Bucket): void {
  const items = store.list<ShopItem>('shop');
  if (items.some((r) => r.data.forBucket === b.n && !r.deleted)) return;
  const maxOrder = items.reduce((m, r) => Math.max(m, r.data.order), 0);
  for (const it of replacementShopping(b, maxOrder + 1)) store.put('shop', newId('shop'), { ...it, checked: false });
}

export function removeReplacementShopping(n: number): void {
  for (const r of store.list<ShopItem>('shop')) if (r.data.forBucket === n) store.remove(r.id);
}
