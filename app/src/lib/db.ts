import { get, set } from 'idb-keyval';
import { useEffect, useState } from 'preact/hooks';
import { createRecordStore, type Persist } from './store';
import { seedRecords } from './plan';
import type { Bucket, Member, PantryItem, Settings, ShopItem, Supplies } from './types';
import { defaultSettings } from './plan';

const KEY = 'kr.records.v1';
const idbPersist: Persist = {
  load: () => get(KEY),
  save: (recs) => set(KEY, recs),
};

export const store = createRecordStore(idbPersist, seedRecords);

/** Re-renderiza o componente quando qualquer dado muda. */
export function useStoreVersion(): number {
  const [v, setV] = useState(store.version);
  useEffect(() => store.subscribe(() => setV(store.version)), []);
  return v;
}

type WithId<T> = T & { id: string };

function listData<T>(kind: Parameters<typeof store.list>[0]): WithId<T>[] {
  return store.list<T>(kind).map((r) => ({ ...r.data, id: r.id }));
}

export function useSettings(): Settings {
  useStoreVersion();
  return { ...defaultSettings, ...(store.get<Settings>('settings')?.data ?? {}) };
}

export function useMembers(): WithId<Member>[] {
  useStoreVersion();
  return listData<Member>('member').sort((a, b) => a.order - b.order);
}

export function useBuckets(): WithId<Bucket>[] {
  useStoreVersion();
  return listData<Bucket>('bucket').sort((a, b) => a.n - b.n);
}

export function usePantry(): WithId<PantryItem>[] {
  useStoreVersion();
  return listData<PantryItem>('pantry').sort((a, b) => a.order - b.order);
}

export function useShop(): WithId<ShopItem>[] {
  useStoreVersion();
  return listData<ShopItem>('shop').sort((a, b) => a.order - b.order);
}

export function useSupplies(): Supplies {
  useStoreVersion();
  return store.get<Supplies>('supplies')?.data ?? { waterGal: 0, waterTargetGal: 190, propaneFull: 0, propaneTarget: 3 };
}

/* ---------- Ações ---------- */

export function saveSettings(patch: Partial<Settings>): void {
  const cur = { ...defaultSettings, ...(store.get<Settings>('settings')?.data ?? {}) };
  store.put('settings', 'settings', { ...cur, ...patch });
}

export function saveSupplies(patch: Partial<Supplies>): void {
  const cur = store.get<Supplies>('supplies')?.data ?? { waterGal: 0, waterTargetGal: 190, propaneFull: 0, propaneTarget: 3 };
  store.put('supply', 'supplies', { ...cur, ...patch });
}

export function saveMember(id: string, patch: Partial<Member>): void {
  store.patch<Member>(id, (m) => ({ ...m, ...patch }));
}

export function savePantry(id: string, patch: Partial<PantryItem>): void {
  store.patch<PantryItem>(id, (p) => ({ ...p, ...patch }));
}

export function saveShop(id: string, patch: Partial<ShopItem>): void {
  store.patch<ShopItem>(id, (p) => ({ ...p, ...patch }));
}

export function saveBucket(id: string, next: Bucket & { id?: string }): void {
  const { id: _omit, ...data } = next;
  store.put('bucket', id, data);
}
