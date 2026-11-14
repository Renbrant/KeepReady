import { get, set } from 'idb-keyval';
import { useEffect, useState } from 'preact/hooks';
import { createRecordStore, type Persist } from './store';
import { seedRecords } from './plan';
import type { Op } from './apply';
import { gearRecId, type GearRec } from './planner';
import type { Bucket, GearState, Member, PantryItem, Settings, ShopItem, StockLot, Supplies, WaterLot } from './types';
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

export function useGear(): GearRec[] {
  useStoreVersion();
  return store.list<GearState>('gear').map((r) => ({ id: r.id, state: r.data }));
}

export function useWater(): WithId<WaterLot>[] {
  useStoreVersion();
  return listData<WaterLot>('water').sort((a, b) => a.order - b.order);
}

export function useLots(): WithId<StockLot>[] {
  useStoreVersion();
  return listData<StockLot>('lot').sort((a, b) => a.order - b.order);
}

/* ---------- Ações ---------- */

export function saveLot(id: string, patch: Partial<StockLot>): void {
  store.patch<StockLot>(id, (l) => ({ ...l, ...patch }));
}

export function saveWater(id: string, patch: Partial<WaterLot>): void {
  const cur = store.get<WaterLot>(id)?.data;
  if (cur) store.put('water', id, { ...cur, ...patch });
}


/** Atualiza o estado de um item das caixas (cria o registro na primeira vez). `id` é o id do catálogo ou do item seu. */
export function saveGear(id: string, patch: Partial<GearState>): void {
  const rid = gearRecId(id);
  const cur = store.get<GearState>(rid)?.data ?? { have: 0 };
  store.put('gear', rid, { ...cur, ...patch });
}

/** Aplica uma lista de operações do plano. */
export function runOps(ops: Op[]): void {
  for (const op of ops) {
    if (op.type === 'put') store.put(op.kind, op.id, op.data);
    else store.remove(op.id);
  }
}

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
