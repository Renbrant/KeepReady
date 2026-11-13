import { store } from './db';
import { clearAccountMeta, getMeta, setMeta } from './meta';
import { supabase } from './supabase';
import { L } from './i18n';

function client() {
  if (!supabase) throw new Error('Este app foi publicado sem as chaves do Supabase, então não há login nem sincronização.');
  return supabase;
}

export function messageOf(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return String(e);
}

export function isNetworkError(e: unknown): boolean {
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(messageOf(e));
}

export function friendly(e: unknown): string {
  const m = messageOf(e);
  if (isNetworkError(e)) return L('Sem internet. Tente de novo quando estiver online.', 'No internet. Try again when you are online.');
  if (/invalid login/i.test(m)) return L('E-mail ou senha incorretos.', 'Incorrect email or password.');
  if (/already registered|already been registered/i.test(m)) return L('Este e-mail já tem conta. Use "Entrar".', 'This email already has an account. Use "Sign in".');
  if (/password should be at least/i.test(m)) return L('A senha precisa ter pelo menos 6 caracteres.', 'The password must be at least 6 characters.');
  if (/email not confirmed/i.test(m)) return L('Confirme seu e-mail pelo link que enviamos e entre de novo.', 'Confirm your email with the link we sent and sign in again.');
  if (/invalid_code/i.test(m)) return L('Código de convite inválido.', 'Invalid invite code.');
  if (/rate limit/i.test(m)) return L('Muitas tentativas. Espere alguns minutos.', 'Too many attempts. Wait a few minutes.');
  return m;
}

export interface HouseholdInfo {
  id: string;
  name: string;
  invite_code: string;
}

export async function signUp(email: string, password: string): Promise<{ needsConfirm: boolean }> {
  const { data, error } = await client().auth.signUp({ email, password });
  if (error) throw error;
  if (!data.session || !data.user) return { needsConfirm: true };
  setMeta({ userId: data.user.id, userEmail: email });
  return { needsConfirm: false };
}

export async function signIn(email: string, password: string): Promise<HouseholdInfo | null> {
  const { data, error } = await client().auth.signInWithPassword({ email, password });
  if (error) throw error;
  setMeta({ userId: data.user.id, userEmail: email });
  return fetchMyHousehold();
}

export async function signOut(): Promise<void> {
  try {
    await client().auth.signOut();
  } finally {
    clearAccountMeta();
  }
}

export async function fetchMyHousehold(): Promise<HouseholdInfo | null> {
  const { data, error } = await client().rpc('my_household');
  if (error) throw error;
  const rows = (data ?? []) as HouseholdInfo[];
  return rows[0] ?? null;
}

/**
 * Liga este aparelho a uma casa.
 * `replaceLocal`: troca os dados do aparelho pelos da casa (quem entra numa casa que já existe).
 * Sem isso, os dados do aparelho sobem para a casa (quem acabou de criá-la).
 */
export function adoptHousehold(h: HouseholdInfo, replaceLocal: boolean): void {
  if (replaceLocal) store.replaceAll([]);
  else store.markAllDirty();
  setMeta({ householdId: h.id, householdName: h.name, inviteCode: h.invite_code, lastSync: null });
}

export async function createHousehold(name: string, displayName: string): Promise<HouseholdInfo> {
  const { data, error } = await client().rpc('create_household', { p_name: name, p_display: displayName });
  if (error) throw error;
  const h = ((data ?? []) as HouseholdInfo[])[0];
  if (!h) throw new Error('Não foi possível criar a casa.');
  adoptHousehold(h, false);
  return h;
}

export async function joinHousehold(code: string, displayName: string): Promise<HouseholdInfo> {
  const { data, error } = await client().rpc('join_household', { p_code: code, p_display: displayName });
  if (error) throw error;
  const h = ((data ?? []) as HouseholdInfo[])[0];
  if (!h) throw new Error('invalid_code');
  adoptHousehold(h, true);
  return h;
}

export function isSignedInLocally(): boolean {
  return !!getMeta().userId;
}
