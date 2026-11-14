import { useEffect, useState } from 'preact/hooks';

/** Dados do aparelho que não vão para o servidor (sessão, casa atual, último sync). */
export interface Meta {
  userId?: string;
  userEmail?: string;
  householdId?: string;
  householdName?: string;
  inviteCode?: string;
  /** Maior `updated_at` do servidor já recebido. */
  lastSync?: string | null;
  lastSyncAt?: string;
  persisted?: boolean;
}

const KEY = 'kr.meta.v1';
let cache: Meta | undefined;
const listeners = new Set<() => void>();

export function getMeta(): Meta {
  if (!cache) {
    try {
      cache = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Meta;
    } catch {
      cache = {};
    }
  }
  return cache;
}

export function setMeta(patch: Partial<Meta>): void {
  cache = { ...getMeta(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* sem localStorage: vale só até fechar o app */
  }
  listeners.forEach((f) => f());
}

export function clearAccountMeta(): void {
  setMeta({ userId: undefined, userEmail: undefined, householdId: undefined, householdName: undefined, inviteCode: undefined, lastSync: null, lastSyncAt: undefined });
}

/** Avisa quando a sessão ou a casa mudam (entrar, sair, trocar de casa). */
export function onMetaChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

export function useMeta(): Meta {
  const [, set] = useState(0);
  useEffect(() => {
    const f = () => set((v) => v + 1);
    listeners.add(f);
    return () => void listeners.delete(f);
  }, []);
  return getMeta();
}
