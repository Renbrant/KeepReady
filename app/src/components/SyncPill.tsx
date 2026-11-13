import { useMeta } from '../lib/meta';
import { syncAvailable } from '../lib/supabase';
import { useSyncState } from '../lib/syncManager';
import { Pill } from './ui';

export function agoLabel(iso?: string): string {
  if (!iso) return '';
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} d`;
}

export function SyncPill() {
  const meta = useMeta();
  const { status } = useSyncState();
  if (!syncAvailable || !meta.householdId) return <Pill tone="neutral">Só neste aparelho</Pill>;
  switch (status) {
    case 'syncing':
      return <Pill tone="info">Sincronizando</Pill>;
    case 'offline':
      return <Pill tone="warn">Offline</Pill>;
    case 'error':
      return <Pill tone="bad">Erro ao sincronizar</Pill>;
    case 'needs-login':
      return <Pill tone="warn">Entre de novo</Pill>;
    default:
      return <Pill tone="ok">Sincronizado {agoLabel(meta.lastSyncAt)}</Pill>;
  }
}
