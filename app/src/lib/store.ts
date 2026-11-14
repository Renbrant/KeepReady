import { KINDS, type Kind, type Rec, type RemoteRec } from './types';

export interface Persist {
  load(): Promise<Rec[] | undefined>;
  save(recs: Rec[]): Promise<void>;
}

export interface BackupFile {
  app: 'keepready';
  version: 1;
  exportedAt: string;
  records: { id: string; kind: Kind; data: unknown; deleted?: boolean }[];
}

export function newId(prefix: string): string {
  const rnd = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rnd}`;
}

/**
 * Armazenamento local-first: tudo vive no aparelho e vai para o servidor depois.
 * Cada registro é pequeno (um balde, um item de compra), então conflitos são raros
 * e a regra é "quem sincroniza por último vence", registro a registro.
 */
export function createRecordStore(persist: Persist, seed: (now: string) => Rec[], clock: () => string = () => new Date().toISOString()) {
  const map = new Map<string, Rec>();
  let rev = 0;
  let version = 0;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();

  function emit() {
    version++;
    listeners.forEach((f) => f());
    schedulePersist();
  }

  function schedulePersist() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void flush(), 150);
  }

  async function flush(): Promise<void> {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = undefined;
    }
    try {
      await persist.save([...map.values()]);
    } catch {
      /* armazenamento cheio ou bloqueado: o app continua em memória */
    }
  }

  async function init(): Promise<void> {
    let loaded: Rec[] | undefined;
    try {
      loaded = await persist.load();
    } catch {
      loaded = undefined;
    }
    if (loaded && loaded.length > 0) {
      for (const r of loaded) {
        map.set(r.id, r);
        rev = Math.max(rev, r.rev ?? 0);
      }
    } else {
      for (const r of seed(clock())) {
        r.rev = ++rev;
        map.set(r.id, r);
      }
      await flush();
    }
    version++;
    listeners.forEach((f) => f());
  }

  function list<T>(kind: Kind): Rec<T>[] {
    const out: Rec<T>[] = [];
    for (const r of map.values()) if (r.kind === kind && !r.deleted) out.push(r as Rec<T>);
    return out;
  }

  function get<T>(id: string): Rec<T> | undefined {
    const r = map.get(id);
    return r && !r.deleted ? (r as Rec<T>) : undefined;
  }

  function put(kind: Kind, id: string, data: unknown): void {
    map.set(id, { id, kind, data, updatedAt: clock(), dirty: true, rev: ++rev, deleted: false });
    emit();
  }

  function patch<T>(id: string, fn: (d: T) => T): void {
    const cur = map.get(id);
    if (!cur || cur.deleted) return;
    put(cur.kind, id, fn(cur.data as T));
  }

  function remove(id: string): void {
    const cur = map.get(id);
    if (!cur) return;
    map.set(id, { ...cur, deleted: true, dirty: true, updatedAt: clock(), rev: ++rev });
    emit();
  }

  function dirty(): Rec[] {
    return [...map.values()].filter((r) => r.dirty);
  }

  /** Marca como sincronizado só se o registro não mudou desde o envio. */
  function markClean(id: string, atRev: number): void {
    const cur = map.get(id);
    if (cur && cur.rev === atRev) map.set(id, { ...cur, dirty: false });
  }

  /** Aplica registros do servidor, sem sobrescrever o que ainda não foi enviado. */
  function applyRemote(rows: RemoteRec[]): number {
    let n = 0;
    for (const r of rows) {
      const local = map.get(r.id);
      if (local?.dirty) continue;
      // a busca usa "maior ou igual", então o último registro volta toda vez: ignora se já está aplicado
      if (local && local.updatedAt === r.updated_at && !!local.deleted === r.deleted) continue;
      map.set(r.id, { id: r.id, kind: r.kind, data: r.data, deleted: r.deleted, updatedAt: r.updated_at, dirty: false, rev: ++rev });
      n++;
    }
    if (n > 0) emit();
    return n;
  }

  function replaceAll(recs: Rec[]): void {
    map.clear();
    for (const r of recs) map.set(r.id, { ...r, rev: ++rev });
    emit();
  }

  /** Marca tudo para enviar (usado ao criar uma casa a partir dos dados que já estão no aparelho). */
  function markAllDirty(): void {
    for (const [id, r] of map) map.set(id, { ...r, dirty: true, rev: ++rev });
    emit();
  }

  function resetToSeed(): void {
    map.clear();
    for (const r of seed(clock())) map.set(r.id, { ...r, rev: ++rev });
    emit();
  }

  function exportBackup(): BackupFile {
    return {
      app: 'keepready',
      version: 1,
      exportedAt: clock(),
      records: [...map.values()].filter((r) => !r.deleted).map((r) => ({ id: r.id, kind: r.kind, data: r.data })),
    };
  }

  /** Lança erro se o arquivo não for um backup do KeepReady. */
  function importBackup(file: unknown): number {
    const f = file as BackupFile;
    if (!f || f.app !== 'keepready' || f.version !== 1 || !Array.isArray(f.records)) throw new Error('Arquivo de backup inválido.');
    const kinds: Kind[] = KINDS;
    const recs: Rec[] = f.records
      .filter((r) => r && typeof r.id === 'string' && kinds.includes(r.kind))
      .map((r) => ({ id: r.id, kind: r.kind, data: r.data, updatedAt: clock(), dirty: true, rev: 0 }));
    if (recs.length === 0) throw new Error('O backup não tem dados.');
    replaceAll(recs);
    return recs.length;
  }

  function subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return {
    init,
    flush,
    list,
    get,
    put,
    patch,
    remove,
    dirty,
    markClean,
    applyRemote,
    replaceAll,
    markAllDirty,
    resetToSeed,
    exportBackup,
    importBackup,
    subscribe,
    get version() {
      return version;
    },
    get size() {
      return map.size;
    },
  };
}

export type RecordStore = ReturnType<typeof createRecordStore>;
