import { useEffect, useState } from 'preact/hooks';
import { isNetworkError, messageOf } from './account';
import { store } from './db';
import { getMeta, onMetaChange, setMeta } from './meta';
import { supabase, supabaseRemote } from './supabase';
import { syncOnce } from './sync';

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'offline' | 'error' | 'needs-login';

let status: SyncStatus = 'off';
let lastError = '';
let running = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function setStatus(s: SyncStatus, err = ''): void {
  status = s;
  lastError = err;
  listeners.forEach((f) => f());
}

export function getSyncState(): { status: SyncStatus; error: string } {
  return { status, error: lastError };
}

export function useSyncState(): { status: SyncStatus; error: string } {
  const [, set] = useState(0);
  useEffect(() => {
    const f = () => set((v) => v + 1);
    listeners.add(f);
    return () => void listeners.delete(f);
  }, []);
  return getSyncState();
}

export async function syncNow(): Promise<void> {
  const meta = getMeta();
  if (!supabase || !meta.householdId) {
    setStatus('off');
    return;
  }
  if (!navigator.onLine) {
    setStatus('offline');
    return;
  }
  if (running) return;
  running = true;
  setStatus('syncing');
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatus('needs-login');
      return;
    }
    const res = await syncOnce(store, supabaseRemote(supabase, meta.householdId), meta.lastSync ?? null);
    setMeta({ lastSync: res.lastSync, lastSyncAt: new Date().toISOString() });
    // casa nova sem nenhum dado no servidor e nada no aparelho: volta ao plano de exemplo
    if (store.size === 0) store.resetToSeed();
    setStatus('idle');
  } catch (e) {
    setStatus(isNetworkError(e) ? 'offline' : 'error', messageOf(e));
  } finally {
    running = false;
  }
}

function scheduleSync(delay = 2500): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), delay);
}

/** Sincroniza ao abrir, ao voltar a internet, a cada minuto com o app aberto e 2,5 s depois de cada edição. */
export function startAutoSync(): void {
  void syncNow();
  // criar, entrar ou sair de uma casa muda o destino: sincroniza (ou desliga) na hora
  let house = getMeta().householdId;
  onMetaChange(() => {
    const now = getMeta().householdId;
    if (now === house) return;
    house = now;
    if (now) void syncNow();
    else setStatus('off');
  });
  store.subscribe(() => {
    // só edições locais disparam envio; o que chega do servidor não gera nova rodada
    if (store.dirty().length > 0 && getMeta().householdId) scheduleSync();
  });
  window.addEventListener('online', () => void syncNow());
  window.addEventListener('offline', () => setStatus(getMeta().householdId ? 'offline' : 'off'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow();
  });
  setInterval(() => {
    if (document.visibilityState === 'visible') void syncNow();
  }, 60_000);
}
