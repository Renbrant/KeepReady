import { describe, expect, it } from 'vitest';
import { createRecordStore, type Persist, type RecordStore } from '../src/lib/store';
import { syncOnce, type Remote } from '../src/lib/sync';
import type { Rec, RemoteRec } from '../src/lib/types';

const memoryPersist = (): Persist => {
  let saved: Rec[] | undefined;
  return { load: async () => saved, save: async (r) => void (saved = structuredClone(r)) };
};

/** Servidor falso: guarda registros e carimba o horário do servidor a cada gravação. */
function fakeServer() {
  const rows = new Map<string, RemoteRec>();
  let tick = 0;
  const stamp = () => new Date(Date.UTC(2026, 10, 13, 12, 0, tick++)).toISOString();
  const remote = (hook?: () => void): Remote => ({
    async pull(since) {
      return [...rows.values()].filter((r) => !since || r.updated_at >= since).sort((a, b) => (a.updated_at < b.updated_at ? -1 : 1));
    },
    async push(recs) {
      hook?.();
      for (const r of recs) rows.set(r.id, { ...structuredClone(r), updated_at: stamp() });
    },
  });
  return { rows, remote };
}

async function device(clockStart: number, seed: (now: string) => Rec[] = () => []): Promise<RecordStore> {
  let t = clockStart;
  const s = createRecordStore(memoryPersist(), seed, () => new Date(Date.UTC(2026, 10, 13, 8, 0, t++)).toISOString());
  await s.init();
  return s;
}

describe('sincronização', () => {
  it('uma alteração no aparelho A aparece no aparelho B', async () => {
    const server = fakeServer();
    const a = await device(0);
    const b = await device(500);
    a.put('bucket', 'bucket-1', { n: 1, status: 'sealed' });
    const ra = await syncOnce(a, server.remote(), null);
    expect(ra.pushed).toBe(1);
    const rb = await syncOnce(b, server.remote(), null);
    expect(rb.pulled).toBe(1);
    expect(b.get<{ status: string }>('bucket-1')?.data.status).toBe('sealed');
  });

  it('alterações offline em registros diferentes convergem nos dois aparelhos', async () => {
    const server = fakeServer();
    const a = await device(0);
    const b = await device(500);
    a.put('shop', 'shop-1', { name: 'arroz', checked: false });
    b.put('shop', 'shop-2', { name: 'feijão', checked: false });
    let la = (await syncOnce(a, server.remote(), null)).lastSync;
    let lb = (await syncOnce(b, server.remote(), null)).lastSync;
    la = (await syncOnce(a, server.remote(), la)).lastSync;
    lb = (await syncOnce(b, server.remote(), lb)).lastSync;
    for (const s of [a, b]) {
      expect(s.get('shop-1')).toBeDefined();
      expect(s.get('shop-2')).toBeDefined();
    }
    expect(la).not.toBeNull();
    expect(lb).not.toBeNull();
  });

  it('mesmo registro editado nos dois: vale quem sincroniza por último, e os dois convergem', async () => {
    const server = fakeServer();
    const a = await device(0);
    const b = await device(500);
    a.put('shop', 'shop-1', { name: 'arroz', checked: false });
    let la = (await syncOnce(a, server.remote(), null)).lastSync;
    let lb = (await syncOnce(b, server.remote(), null)).lastSync;
    a.put('shop', 'shop-1', { name: 'arroz', checked: true, by: 'A' });
    b.put('shop', 'shop-1', { name: 'arroz', checked: false, by: 'B' });
    la = (await syncOnce(a, server.remote(), la)).lastSync;
    lb = (await syncOnce(b, server.remote(), lb)).lastSync;
    la = (await syncOnce(a, server.remote(), la)).lastSync;
    expect(a.get<{ by: string }>('shop-1')?.data.by).toBe('B');
    expect(b.get<{ by: string }>('shop-1')?.data.by).toBe('B');
    expect(lb).not.toBeNull();
    expect(la).not.toBeNull();
  });

  it('o que foi editado durante o envio não é apagado pelo que volta do servidor', async () => {
    const server = fakeServer();
    const a = await device(0);
    a.put('shop', 'shop-1', { v: 1 });
    // enquanto o envio acontece, o usuário edita de novo
    const remote = server.remote(() => a.put('shop', 'shop-1', { v: 2 }));
    await syncOnce(a, remote, null);
    expect(a.get<{ v: number }>('shop-1')?.data.v).toBe(2);
    expect(a.dirty().map((r) => r.id)).toEqual(['shop-1']);
    // na rodada seguinte o v2 sobe
    await syncOnce(a, server.remote(), null);
    expect(a.dirty()).toHaveLength(0);
    expect((server.rows.get('shop-1')?.data as { v: number }).v).toBe(2);
  });

  it('exclusão chega ao outro aparelho', async () => {
    const server = fakeServer();
    const a = await device(0);
    const b = await device(500);
    a.put('shop', 'shop-1', { name: 'arroz' });
    let la = (await syncOnce(a, server.remote(), null)).lastSync;
    let lb = (await syncOnce(b, server.remote(), null)).lastSync;
    a.remove('shop-1');
    la = (await syncOnce(a, server.remote(), la)).lastSync;
    lb = (await syncOnce(b, server.remote(), lb)).lastSync;
    expect(b.get('shop-1')).toBeUndefined();
    expect(la).not.toBeNull();
    expect(lb).not.toBeNull();
  });

  it('sem nada para enviar, só busca', async () => {
    const server = fakeServer();
    const a = await device(0);
    const r = await syncOnce(a, server.remote(), null);
    expect(r).toEqual({ pushed: 0, pulled: 0, lastSync: null });
  });
});

describe('armazenamento local', () => {
  it('guarda e recarrega depois de fechar o app', async () => {
    const persist = memoryPersist();
    const s1 = createRecordStore(persist, () => []);
    await s1.init();
    s1.put('bucket', 'bucket-1', { status: 'sealed' });
    await s1.flush();
    const s2 = createRecordStore(persist, () => []);
    await s2.init();
    expect(s2.get<{ status: string }>('bucket-1')?.data.status).toBe('sealed');
  });

  it('na primeira abertura carrega o plano de exemplo', async () => {
    const s = createRecordStore(memoryPersist(), (now) => [{ id: 'x', kind: 'settings', data: {}, updatedAt: now, dirty: true, rev: 0 }]);
    await s.init();
    expect(s.get('x')).toBeDefined();
  });

  it('backup exporta e importa; arquivo estranho é recusado', async () => {
    const a = await device(0);
    a.put('member', 'member-1', { name: 'Ana' });
    const file = a.exportBackup();
    const b = await device(500);
    expect(b.importBackup(JSON.parse(JSON.stringify(file)))).toBe(1);
    expect(b.get<{ name: string }>('member-1')?.data.name).toBe('Ana');
    expect(() => b.importBackup({ foo: 1 })).toThrow(/inválido/);
    expect(() => b.importBackup({ app: 'keepready', version: 1, records: [] })).toThrow(/não tem dados/);
  });
});
