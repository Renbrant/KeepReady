import { useRef, useState } from 'preact/hooks';
import { Btn, Card, NumField, Pill, SelectField, TextField } from '../components/ui';
import { saveSettings, store, useSettings } from '../lib/db';
import { isStandalone } from '../lib/fmt';
import { isIos, useInstallPrompt } from '../lib/install';
import { useMeta } from '../lib/meta';
import type { Settings as S } from '../lib/types';

function download(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Settings() {
  const s = useSettings();
  const meta = useMeta();
  const install = useInstallPrompt();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState<'' | 'reset' | 'import'>('');
  const [pending, setPending] = useState<unknown>(null);

  const exportNow = () => {
    const day = new Date().toISOString().slice(0, 10);
    download(`keepready-backup-${day}.json`, JSON.stringify(store.exportBackup(), null, 2));
    setErr('');
    setMsg('Backup salvo. Guarde o arquivo fora do celular.');
  };

  const onFile = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    setMsg('');
    try {
      const parsed: unknown = JSON.parse(await f.text());
      const n = (parsed as { records?: unknown[] })?.records?.length;
      if (typeof n !== 'number') throw new Error('Arquivo de backup inválido.');
      setPending(parsed);
      setConfirm('import');
      setErr('');
    } catch (ex) {
      setErr(ex instanceof SyntaxError ? 'Arquivo de backup inválido.' : (ex as Error).message);
    }
  };

  const doImport = () => {
    try {
      const n = store.importBackup(pending);
      setMsg(`Backup restaurado (${n} registros).`);
      setErr('');
    } catch (ex) {
      setErr((ex as Error).message);
    }
    setPending(null);
    setConfirm('');
  };

  const doReset = () => {
    store.resetToSeed();
    store.markAllDirty();
    setConfirm('');
    setMsg('Plano de exemplo restaurado.');
  };

  const set = <K extends keyof S>(k: K, v: S[K]) => saveSettings({ [k]: v } as Partial<S>);

  return (
    <>
      <div class="topbar">
        <div>
          <h1>Ajustes</h1>
          <div class="sub">Plano, altitude e dados do aparelho</div>
        </div>
      </div>

      <Card>
        <h2>Plano</h2>
        <div class="stack">
          <TextField label="Nome da casa" value={s.householdName} onChange={(v) => set('householdName', v)} />
          <div class="grid2">
            <NumField label="Meta de dias" suffix="dias" value={s.daysTarget} min={1} step={1} onChange={(v) => set('daysTarget', Math.max(1, Math.round(v ?? 30)))} />
            <NumField label="Altitude" suffix="pés" value={s.altitudeFt} min={0} step={100} onChange={(v) => set('altitudeFt', Math.max(0, v ?? 0))} />
          </div>
          <SelectField<S['cookingMode']>
            label="Modo de cozinhar"
            value={s.cookingMode}
            options={[
              { value: 'pressure', label: 'Panela de pressão' },
              { value: 'open', label: 'Panela aberta' },
            ]}
            onChange={(v) => set('cookingMode', v)}
          />
          <NumField label="Água de beber" suffix="L por pessoa por dia" value={s.drinkLPerPersonDay} min={0} step={0.1} onChange={(v) => set('drinkLPerPersonDay', Math.max(0, v ?? 0))} />
          <div class="xs muted">1 galão = 3,79 L. Veja em Guias de onde vêm os cálculos de altitude e o que é estimativa.</div>
        </div>
      </Card>

      <Card>
        <h2>Aparência</h2>
        <SelectField<S['theme']>
          label="Tema"
          value={s.theme}
          options={[
            { value: 'auto', label: 'Seguir o aparelho' },
            { value: 'dark', label: 'Escuro' },
            { value: 'light', label: 'Claro' },
          ]}
          onChange={(v) => set('theme', v)}
        />
        <div class="xs muted" style={{ marginTop: 6 }}>Esta escolha também sincroniza com a casa.</div>
      </Card>

      <Card>
        <h2>Instalar e uso offline</h2>
        <div class="row wrap" style={{ marginBottom: 8 }}>
          <Pill tone={isStandalone() ? 'ok' : 'warn'}>{isStandalone() ? 'Instalado' : 'Não instalado'}</Pill>
          <Pill tone={meta.persisted ? 'ok' : 'neutral'}>{meta.persisted ? 'Armazenamento protegido' : 'Armazenamento comum'}</Pill>
        </div>
        {!isStandalone() && install.canPrompt && (
          <Btn kind="primary" onClick={() => void install.prompt()}>
            Instalar o app
          </Btn>
        )}
        {!isStandalone() && !install.canPrompt && (
          <p class="small muted" style={{ marginBottom: 0 }}>
            {isIos()
              ? 'No iPhone, abra no Safari, toque em Compartilhar e escolha Adicionar à Tela de Início.'
              : 'No Android, abra o menu do Chrome e escolha Instalar app. No computador, use o ícone de instalar na barra de endereço.'}
          </p>
        )}
        <p class="xs muted" style={{ marginTop: 8, marginBottom: 0 }}>
          Depois da primeira abertura com internet o app abre sem conexão. Veja mais em Guias.
        </p>
      </Card>

      <Card>
        <h2>Backup e papel</h2>
        <p class="small muted">Um arquivo com todos os seus dados. Guarde em outro lugar, como o e-mail ou um pen drive.</p>
        <div class="row wrap">
          <Btn kind="primary" onClick={exportNow}>
            Exportar backup
          </Btn>
          <Btn onClick={() => fileRef.current?.click()}>Restaurar backup</Btn>
          <a class="btn" href="#/imprimir" style={{ textDecoration: 'none' }}>
            Imprimir resumo
          </a>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => void onFile(e)} />
        {confirm === 'import' && (
          <div class="banner" style={{ marginTop: 12 }}>
            Restaurar troca todos os dados deste aparelho pelos do arquivo. Se você estiver numa casa, a troca também vai para os outros membros.
            <div class="row wrap" style={{ marginTop: 8 }}>
              <Btn kind="danger" small onClick={doImport}>
                Trocar pelos dados do arquivo
              </Btn>
              <Btn
                small
                onClick={() => {
                  setConfirm('');
                  setPending(null);
                }}
              >
                Cancelar
              </Btn>
            </div>
          </div>
        )}
        {msg && <div class="okmsg" style={{ marginTop: 8 }}>{msg}</div>}
        {err && <div class="error" style={{ marginTop: 8 }}>{err}</div>}
      </Card>

      <Card>
        <h2>Recomeçar</h2>
        <p class="small muted">Volta ao plano de exemplo (4 adultos, 7 baldes, lista do Costco). Apaga o que você registrou.</p>
        {confirm === 'reset' ? (
          <div class="banner">
            Isto apaga seus baldes lacrados, a despensa, as compras marcadas e as metas.
            <div class="row wrap" style={{ marginTop: 8 }}>
              <Btn kind="danger" small onClick={doReset}>
                Sim, voltar ao plano de exemplo
              </Btn>
              <Btn small onClick={() => setConfirm('')}>
                Cancelar
              </Btn>
            </div>
          </div>
        ) : (
          <Btn kind="danger" small onClick={() => setConfirm('reset')}>
            Voltar ao plano de exemplo
          </Btn>
        )}
      </Card>

      <div class="xs faint" style={{ textAlign: 'center', marginBottom: 16 }}>KeepReady · versão de teste</div>
    </>
  );
}
