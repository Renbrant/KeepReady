import { useEffect, useState } from 'preact/hooks';
import {
  adoptHousehold,
  createHousehold,
  fetchMyHousehold,
  friendly,
  joinHousehold,
  signIn,
  signOut,
  signUp,
  type HouseholdInfo,
} from '../lib/account';
import { useMeta } from '../lib/meta';
import { syncAvailable } from '../lib/supabase';
import { syncNow, useSyncState } from '../lib/syncManager';
import { agoLabel } from './SyncPill';
import { Btn, Card, TextField } from './ui';
import { L } from '../lib/i18n';

export function Account() {
  const meta = useMeta();
  const sync = useSyncState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [display, setDisplay] = useState('');
  const [houseName, setHouseName] = useState('');
  const [code, setCode] = useState('');
  const [existing, setExisting] = useState<HouseholdInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!syncAvailable || !meta.userId || meta.householdId) return;
    fetchMyHousehold()
      .then(setExisting)
      .catch(() => setExisting(null));
  }, [meta.userId, meta.householdId]);

  if (!syncAvailable) {
    return (
      <Card>
        <h2>{L('Conta e sincronização', 'Account and sync')}</h2>
        <p class="small muted" style={{ marginBottom: 0 }}>
          {L('Este app foi publicado sem as chaves do Supabase, então os dados ficam só neste aparelho e não há login. Para ligar o login e a sincronização entre a família, siga o passo a passo do README.', 'This app was published without the Supabase keys, so data stays only on this device and there is no login. To turn on login and family sync, follow the steps in the README.')}
        </p>
      </Card>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      await fn();
    } catch (e) {
      setErr(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  if (!meta.userId) {
    return (
      <Card>
        <h2>{L('Entrar para sincronizar', 'Sign in to sync')}</h2>
        <p class="small muted">{L('O app funciona sem conta. O login serve para a família compartilhar os mesmos dados.', 'The app works without an account. Login lets the family share the same data.')}</p>
        <form
          class="stack"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              setExisting(await signIn(email.trim(), password));
            });
          }}
        >
          <TextField label={L('E-mail', 'Email')} type="email" value={email} onChange={setEmail} autocomplete="email" />
          <TextField label={L('Senha (mínimo 6 caracteres)', 'Password (at least 6 characters)')} type="password" value={password} onChange={setPassword} autocomplete="current-password" />
          <div class="row wrap">
            <Btn kind="primary" type="submit" disabled={busy || !email || password.length < 6}>
              {L('Entrar', 'Sign in')}
            </Btn>
            <Btn
              disabled={busy || !email || password.length < 6}
              onClick={() =>
                void run(async () => {
                  const r = await signUp(email.trim(), password);
                  if (r.needsConfirm) setMsg(L('Conta criada. Confirme o e-mail pelo link que enviamos e depois toque em Entrar.', 'Account created. Confirm your email with the link we sent, then tap Sign in.'));
                  else setExisting(await fetchMyHousehold());
                })
              }
            >
              {L('Criar conta', 'Create account')}
            </Btn>
          </div>
          {err && <div class="error">{err}</div>}
          {msg && <div class="okmsg">{msg}</div>}
        </form>
      </Card>
    );
  }

  if (!meta.householdId) {
    return (
      <Card>
        <h2>{L('Sua casa', 'Your household')}</h2>
        <p class="small muted">
          {L('Conectado como ', 'Signed in as ')}<b>{meta.userEmail}</b>.
        </p>
        <div class="stack">
          {existing && (
            <div class="banner">
              {L('Você já faz parte da casa ', 'You are already part of the household ')}<b>{existing.name}</b>{L('. Neste aparelho, use os dados da casa.', '. On this device, use the household data.')}
              <div style={{ marginTop: 8 }}>
                <Btn kind="primary" onClick={() => adoptHousehold(existing, true)}>
                  {L('Usar os dados da casa (substitui os deste aparelho)', 'Use the household data (replaces this device’s data)')}
                </Btn>
              </div>
              <div style={{ marginTop: 8 }}>
                <Btn small onClick={() => adoptHousehold(existing, false)}>
                  {L('Enviar os dados deste aparelho para a casa', 'Send this device’s data to the household')}
                </Btn>
              </div>
            </div>
          )}
          {!existing && (
            <>
              <h3>{L('Criar uma casa nova', 'Create a new household')}</h3>
              <TextField label={L('Nome da casa', 'Household name')} value={houseName} onChange={setHouseName} placeholder={L('Família Silva', 'Smith family')} />
              <TextField label={L('Seu nome', 'Your name')} value={display} onChange={setDisplay} />
              <Btn kind="primary" disabled={busy || !houseName.trim()} onClick={() => void run(async () => void (await createHousehold(houseName.trim(), display.trim())))}>
                {L('Criar casa e enviar meus dados', 'Create household and send my data')}
              </Btn>
              <h3 style={{ marginTop: 14 }}>{L('Ou entrar com um código', 'Or join with a code')}</h3>
              <TextField label={L('Código de convite', 'Invite code')} value={code} onChange={(v) => setCode(v.toUpperCase())} placeholder="A1B2C3D4E5" />
              <Btn disabled={busy || !code.trim()} onClick={() => void run(async () => void (await joinHousehold(code.trim(), display.trim())))}>
                {L('Entrar na casa (usa os dados dela)', 'Join the household (uses its data)')}
              </Btn>
            </>
          )}
          {err && <div class="error">{err}</div>}
          <Btn small onClick={() => void signOut()}>
            {L('Sair da conta', 'Sign out')}
          </Btn>
        </div>
      </Card>
    );
  }

  const shareText = L(`Entre na casa "${meta.householdName}" no KeepReady com o código ${meta.inviteCode}.`, `Join the household "${meta.householdName}" on KeepReady with the code ${meta.inviteCode}.`);
  return (
    <Card>
      <h2>{L('Casa: ', 'Household: ')}{meta.householdName}</h2>
      <p class="small muted">
        {L('Conectado como ', 'Signed in as ')}<b>{meta.userEmail}</b>.
      </p>
      <div class="banner">
        <div class="xs muted">{L('Código de convite', 'Invite code')}</div>
        <div class="mono" style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.08em' }}>{meta.inviteCode}</div>
        <div class="row wrap" style={{ marginTop: 8 }}>
          <Btn
            small
            onClick={() => {
              void navigator.clipboard?.writeText(meta.inviteCode ?? '').then(() => setMsg(L('Código copiado.', 'Code copied.')));
            }}
          >
            {L('Copiar', 'Copy')}
          </Btn>
          {typeof navigator.share === 'function' && (
            <Btn small onClick={() => void navigator.share({ title: 'KeepReady', text: shareText, url: location.href.split('#')[0] }).catch(() => undefined)}>
              {L('Compartilhar', 'Share')}
            </Btn>
          )}
        </div>
        <div class="xs muted" style={{ marginTop: 8 }}>
          {L('Quem receber o código cria uma conta, toca em "Entrar na casa" e passa a ver e editar os mesmos dados.', 'Whoever receives the code creates an account, taps "Join the household" and can then see and edit the same data.')}
        </div>
      </div>
      <div class="row between" style={{ marginTop: 12 }}>
        <div class="small">
          {sync.status === 'syncing' && L('Sincronizando…', 'Syncing…')}
          {sync.status === 'idle' && L(`Sincronizado ${agoLabel(meta.lastSyncAt)}`, `Synced ${agoLabel(meta.lastSyncAt)}`)}
          {sync.status === 'offline' && L('Sem internet: os dados ficam no aparelho e sobem depois.', 'No internet: data stays on the device and uploads later.')}
          {sync.status === 'needs-login' && L('Sessão expirada. Entre de novo quando tiver internet.', 'Session expired. Sign in again when you have internet.')}
          {sync.status === 'error' && <span class="error">{L('Erro: ', 'Error: ')}{sync.error}</span>}
          {sync.status === 'off' && L('Aguardando a primeira sincronização.', 'Waiting for the first sync.')}
        </div>
        <Btn small onClick={() => void syncNow()}>
          {L('Sincronizar', 'Sync')}
        </Btn>
      </div>
      {msg && <div class="okmsg" style={{ marginTop: 8 }}>{msg}</div>}
      <div style={{ marginTop: 12 }}>
        <Btn small kind="danger" onClick={() => void signOut()}>
          {L('Sair da conta (os dados ficam no aparelho)', 'Sign out (data stays on the device)')}
        </Btn>
      </div>
    </Card>
  );
}
