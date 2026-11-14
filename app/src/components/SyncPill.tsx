import { useMeta } from '../lib/meta';
import { syncAvailable } from '../lib/supabase';
import { useSyncState } from '../lib/syncManager';
import { Pill } from './ui';
import { L } from '../lib/i18n';

export function agoLabel(iso?: string): string {
  if (!iso) return '';
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return L('agora', 'now');
  if (min < 60) return L(`há ${min} min`, `${min} min ago`);
  const h = Math.round(min / 60);
  if (h < 24) return L(`há ${h} h`, `${h} h ago`);
  return L(`há ${Math.round(h / 24)} d`, `${Math.round(h / 24)} d ago`);
}

export function SyncPill() {
  const meta = useMeta();
  const { status } = useSyncState();
  if (!syncAvailable || !meta.householdId) return <Pill tone="neutral">{L('Só neste aparelho', 'Only on this device')}</Pill>;
  switch (status) {
    case 'syncing':
      return <Pill tone="info">{L('Sincronizando', 'Syncing')}</Pill>;
    case 'offline':
      return <Pill tone="warn">Offline</Pill>;
    case 'error':
      return <Pill tone="bad">{L('Erro ao sincronizar', 'Sync error')}</Pill>;
    case 'needs-login':
      return <Pill tone="warn">{L('Entre de novo', 'Sign in again')}</Pill>;
    default:
      return <Pill tone="ok">{L('Sincronizado ', 'Synced ')}{agoLabel(meta.lastSyncAt)}</Pill>;
  }
}
