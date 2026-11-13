import type { RemoteRec } from './types';
import type { RecordStore } from './store';

export interface Remote {
  pull(since: string | null): Promise<RemoteRec[]>;
  push(recs: RemoteRec[]): Promise<void>;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  lastSync: string | null;
}

/**
 * Uma rodada: envia o que mudou no aparelho e depois busca o que mudou no servidor.
 * O relógio que vale é o do servidor (`updated_at`), então aparelhos com a hora errada não bagunçam nada.
 */
export async function syncOnce(store: RecordStore, remote: Remote, lastSync: string | null): Promise<SyncResult> {
  const pending = store.dirty();
  if (pending.length > 0) {
    await remote.push(
      pending.map((r) => ({ id: r.id, kind: r.kind, data: r.data, deleted: !!r.deleted, updated_at: r.updatedAt })),
    );
    for (const r of pending) store.markClean(r.id, r.rev);
  }
  const rows = await remote.pull(lastSync);
  const pulled = store.applyRemote(rows);
  let newest = lastSync;
  for (const r of rows) if (!newest || r.updated_at > newest) newest = r.updated_at;
  return { pushed: pending.length, pulled, lastSync: newest };
}
