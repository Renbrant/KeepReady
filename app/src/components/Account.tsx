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
        <h2>Conta e sincronização</h2>
        <p class="small muted" style={{ marginBottom: 0 }}>
          Este app foi publicado sem as chaves do Supabase, então os dados ficam só neste aparelho e não há login. Para ligar o login e a sincronização entre a família, siga o passo a passo do README.
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
        <h2>Entrar para sincronizar</h2>
        <p class="small muted">O app funciona sem conta. O login serve para a família compartilhar os mesmos dados.</p>
        <form
          class="stack"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              setExisting(await signIn(email.trim(), password));
            });
          }}
        >
          <TextField label="E-mail" type="email" value={email} onChange={setEmail} autocomplete="email" />
          <TextField label="Senha (mínimo 6 caracteres)" type="password" value={password} onChange={setPassword} autocomplete="current-password" />
          <div class="row wrap">
            <Btn kind="primary" type="submit" disabled={busy || !email || password.length < 6}>
              Entrar
            </Btn>
            <Btn
              disabled={busy || !email || password.length < 6}
              onClick={() =>
                void run(async () => {
                  const r = await signUp(email.trim(), password);
                  if (r.needsConfirm) setMsg('Conta criada. Confirme o e-mail pelo link que enviamos e depois toque em Entrar.');
                  else setExisting(await fetchMyHousehold());
                })
              }
            >
              Criar conta
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
        <h2>Sua casa</h2>
        <p class="small muted">
          Conectado como <b>{meta.userEmail}</b>.
        </p>
        <div class="stack">
          {existing && (
            <div class="banner">
              Você já faz parte da casa <b>{existing.name}</b>. Neste aparelho, use os dados da casa.
              <div style={{ marginTop: 8 }}>
                <Btn kind="primary" onClick={() => adoptHousehold(existing, true)}>
                  Usar os dados da casa (substitui os deste aparelho)
                </Btn>
              </div>
              <div style={{ marginTop: 8 }}>
                <Btn small onClick={() => adoptHousehold(existing, false)}>
                  Enviar os dados deste aparelho para a casa
                </Btn>
              </div>
            </div>
          )}
          {!existing && (
            <>
              <h3>Criar uma casa nova</h3>
              <TextField label="Nome da casa" value={houseName} onChange={setHouseName} placeholder="Família Silva" />
              <TextField label="Seu nome" value={display} onChange={setDisplay} />
              <Btn kind="primary" disabled={busy || !houseName.trim()} onClick={() => void run(async () => void (await createHousehold(houseName.trim(), display.trim())))}>
                Criar casa e enviar meus dados
              </Btn>
              <h3 style={{ marginTop: 14 }}>Ou entrar com um código</h3>
              <TextField label="Código de convite" value={code} onChange={(v) => setCode(v.toUpperCase())} placeholder="A1B2C3D4E5" />
              <Btn disabled={busy || !code.trim()} onClick={() => void run(async () => void (await joinHousehold(code.trim(), display.trim())))}>
                Entrar na casa (usa os dados dela)
              </Btn>
            </>
          )}
          {err && <div class="error">{err}</div>}
          <Btn small onClick={() => void signOut()}>
            Sair da conta
          </Btn>
        </div>
      </Card>
    );
  }

  const shareText = `Entre na casa "${meta.householdName}" no KeepReady com o código ${meta.inviteCode}.`;
  return (
    <Card>
      <h2>Casa: {meta.householdName}</h2>
      <p class="small muted">
        Conectado como <b>{meta.userEmail}</b>.
      </p>
      <div class="banner">
        <div class="xs muted">Código de convite</div>
        <div class="mono" style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.08em' }}>{meta.inviteCode}</div>
        <div class="row wrap" style={{ marginTop: 8 }}>
          <Btn
            small
            onClick={() => {
              void navigator.clipboard?.writeText(meta.inviteCode ?? '').then(() => setMsg('Código copiado.'));
            }}
          >
            Copiar
          </Btn>
          {typeof navigator.share === 'function' && (
            <Btn small onClick={() => void navigator.share({ title: 'KeepReady', text: shareText, url: location.href.split('#')[0] }).catch(() => undefined)}>
              Compartilhar
            </Btn>
          )}
        </div>
        <div class="xs muted" style={{ marginTop: 8 }}>
          Quem receber o código cria uma conta, toca em "Entrar na casa" e passa a ver e editar os mesmos dados.
        </div>
      </div>
      <div class="row between" style={{ marginTop: 12 }}>
        <div class="small">
          {sync.status === 'syncing' && 'Sincronizando…'}
          {sync.status === 'idle' && `Sincronizado ${agoLabel(meta.lastSyncAt)}`}
          {sync.status === 'offline' && 'Sem internet: os dados ficam no aparelho e sobem depois.'}
          {sync.status === 'needs-login' && 'Sessão expirada. Entre de novo quando tiver internet.'}
          {sync.status === 'error' && <span class="error">Erro: {sync.error}</span>}
          {sync.status === 'off' && 'Aguardando a primeira sincronização.'}
        </div>
        <Btn small onClick={() => void syncNow()}>
          Sincronizar
        </Btn>
      </div>
      {msg && <div class="okmsg" style={{ marginTop: 8 }}>{msg}</div>}
      <div style={{ marginTop: 12 }}>
        <Btn small kind="danger" onClick={() => void signOut()}>
          Sair da conta (os dados ficam no aparelho)
        </Btn>
      </div>
    </Card>
  );
}
