import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Remote } from './sync';
import type { RemoteRec } from './types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Sem as chaves, o app funciona só no aparelho (sem login e sem sincronização). */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }) : null;

export const syncAvailable = supabase !== null;

const PAGE = 1000;

export function supabaseRemote(client: SupabaseClient, householdId: string): Remote {
  return {
    async pull(since) {
      const out: RemoteRec[] = [];
      // volta 10 s para não perder gravações que terminaram fora de ordem; registros repetidos são ignorados
      let cursor = since ? new Date(Date.parse(since) - 10_000).toISOString() : null;
      for (let guard = 0; guard < 50; guard++) {
        let q = client
          .from('records')
          .select('id,kind,data,deleted,updated_at')
          .eq('household_id', householdId)
          .order('updated_at', { ascending: true })
          .limit(PAGE);
        if (cursor) q = q.gte('updated_at', cursor);
        const { data, error } = await q;
        if (error) throw error;
        const rows = (data ?? []) as RemoteRec[];
        out.push(...rows);
        if (rows.length < PAGE) break;
        const last = rows[rows.length - 1].updated_at;
        if (last === cursor) break;
        cursor = last;
      }
      return out;
    },
    async push(recs) {
      const { error } = await client.from('records').upsert(
        recs.map((r) => ({ household_id: householdId, id: r.id, kind: r.kind, data: r.data, deleted: r.deleted })),
        { onConflict: 'household_id,id' },
      );
      if (error) throw error;
    },
  };
}
