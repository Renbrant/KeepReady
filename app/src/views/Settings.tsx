import { useRef, useState } from 'preact/hooks';
import { Btn, Card, NumField, Pill, SelectField, TextField } from '../components/ui';
import { saveSettings, store, useSettings } from '../lib/db';
import { isStandalone } from '../lib/fmt';
import { isIos, useInstallPrompt } from '../lib/install';
import { useMeta } from '../lib/meta';
import type { Settings as S } from '../lib/types';
import { getLang, setLang, useLang, type Lang } from '../lib/i18n';
import { L } from '../lib/i18n';

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
  useLang();
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
    setMsg(L('Backup salvo. Guarde o arquivo fora do celular.', 'Backup saved. Keep the file outside your phone.'));
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
      if (typeof n !== 'number') throw new Error(L('Arquivo de backup inválido.', 'Invalid backup file.'));
      setPending(parsed);
      setConfirm('import');
      setErr('');
    } catch (ex) {
      setErr(ex instanceof SyntaxError ? L('Arquivo de backup inválido.', 'Invalid backup file.') : (ex as Error).message);
    }
  };

  const doImport = () => {
    try {
      const n = store.importBackup(pending);
      setMsg(L(`Backup restaurado (${n} registros).`, `Backup restored (${n} records).`));
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
    setMsg(L('Plano de exemplo restaurado.', 'Sample plan restored.'));
  };

  const set = <K extends keyof S>(k: K, v: S[K]) => saveSettings({ [k]: v } as Partial<S>);

  return (
    <>
      <div class="topbar">
        <div>
          <h1>{L('Ajustes', 'Settings')}</h1>
          <div class="sub">{L('Plano, altitude e dados do aparelho', 'Plan, altitude and device data')}</div>
        </div>
      </div>

      <Card>
        <h2>{L('Plano', 'Plan')}</h2>
        <div class="stack">
          <TextField label={L('Nome da casa', 'Household name')} value={s.householdName} onChange={(v) => set('householdName', v)} />
          <div class="grid2">
            <NumField label={L('Meta de dias', 'Goal in days')} suffix={L('dias', 'days')} value={s.daysTarget} min={1} step={1} onChange={(v) => set('daysTarget', Math.max(1, Math.round(v ?? 30)))} />
            <NumField label={L('Altitude', 'Altitude')} suffix={L('pés', 'ft')} value={s.altitudeFt} min={0} step={100} onChange={(v) => set('altitudeFt', Math.max(0, v ?? 0))} />
          </div>
          <SelectField<S['cookingMode']>
            label={L('Modo de cozinhar', 'Cooking mode')}
            value={s.cookingMode}
            options={[
              { value: 'pressure', label: L('Panela de pressão', 'Pressure cooker') },
              { value: 'open', label: L('Panela aberta', 'Open pot') },
            ]}
            onChange={(v) => set('cookingMode', v)}
          />
          <NumField label={L('Água de beber', 'Drinking water')} suffix={L('L por pessoa por dia', 'L per person per day')} value={s.drinkLPerPersonDay} min={0} step={0.1} onChange={(v) => set('drinkLPerPersonDay', Math.max(0, v ?? 0))} />
          <div class="xs muted">{L('1 galão = 3,79 L. Veja em Guias de onde vêm os cálculos de altitude e o que é estimativa.', '1 gallon = 3.79 L. See Guides for where the altitude calculations come from and what is an estimate.')}</div>
        </div>
      </Card>

      <Card>
        <h2>{L('Idioma', 'Language')}</h2>
        <SelectField<Lang>
          label={L('Idioma do app', 'App language')}
          value={getLang()}
          options={[
            { value: 'en', label: 'English' },
            { value: 'pt', label: 'Português' },
          ]}
          onChange={(v) => setLang(v)}
        />
        <div class="xs muted" style={{ marginTop: 6 }}>{L('Vale só neste aparelho.', 'Applies to this device only.')}</div>
      </Card>

      <Card>
        <h2>{L('Aparência', 'Appearance')}</h2>
        <SelectField<S['theme']>
          label={L('Tema', 'Theme')}
          value={s.theme}
          options={[
            { value: 'auto', label: L('Seguir o aparelho', 'Follow the device') },
            { value: 'dark', label: L('Escuro', 'Dark') },
            { value: 'light', label: L('Claro', 'Light') },
          ]}
          onChange={(v) => set('theme', v)}
        />
        <div class="xs muted" style={{ marginTop: 6 }}>{L('Esta escolha também sincroniza com a casa.', 'This choice also syncs with the household.')}</div>
      </Card>

      <Card>
        <h2>{L('Instalar e uso offline', 'Install and offline use')}</h2>
        <div class="row wrap" style={{ marginBottom: 8 }}>
          <Pill tone={isStandalone() ? 'ok' : 'warn'}>{isStandalone() ? L('Instalado', 'Installed') : L('Não instalado', 'Not installed')}</Pill>
          <Pill tone={meta.persisted ? 'ok' : 'neutral'}>{meta.persisted ? L('Armazenamento protegido', 'Protected storage') : L('Armazenamento comum', 'Regular storage')}</Pill>
        </div>
        {!isStandalone() && install.canPrompt && (
          <Btn kind="primary" onClick={() => void install.prompt()}>
            {L('Instalar o app', 'Install the app')}
          </Btn>
        )}
        {!isStandalone() && !install.canPrompt && (
          <p class="small muted" style={{ marginBottom: 0 }}>
            {isIos()
              ? L('No iPhone, abra no Safari, toque em Compartilhar e escolha Adicionar à Tela de Início.', 'On iPhone, open in Safari, tap Share and choose Add to Home Screen.')
              : L('No Android, abra o menu do Chrome e escolha Instalar app. No computador, use o ícone de instalar na barra de endereço.', 'On Android, open the Chrome menu and choose Install app. On a computer, use the install icon in the address bar.')}
          </p>
        )}
        <p class="xs muted" style={{ marginTop: 8, marginBottom: 0 }}>
          {L('Depois da primeira abertura com internet o app abre sem conexão. Veja mais em Guias.', 'After the first time you open it with internet, the app opens offline. See more in Guides.')}
        </p>
      </Card>

      <Card>
        <h2>{L('Backup e papel', 'Backup and paper')}</h2>
        <p class="small muted">{L('Um arquivo com todos os seus dados. Guarde em outro lugar, como o e-mail ou um pen drive.', 'One file with all your data. Keep it somewhere else, like your email or a flash drive.')}</p>
        <div class="row wrap">
          <Btn kind="primary" onClick={exportNow}>
            {L('Exportar backup', 'Export backup')}
          </Btn>
          <Btn onClick={() => fileRef.current?.click()}>{L('Restaurar backup', 'Restore backup')}</Btn>
          <a class="btn" href="#/imprimir" style={{ textDecoration: 'none' }}>
            {L('Imprimir resumo', 'Print summary')}
          </a>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => void onFile(e)} />
        {confirm === 'import' && (
          <div class="banner" style={{ marginTop: 12 }}>
            {L('Restaurar troca todos os dados deste aparelho pelos do arquivo. Se você estiver numa casa, a troca também vai para os outros membros.', 'Restoring replaces all data on this device with the file’s. If you are in a household, the change also goes to the other members.')}
            <div class="row wrap" style={{ marginTop: 8 }}>
              <Btn kind="danger" small onClick={doImport}>
                {L('Trocar pelos dados do arquivo', 'Replace with the file’s data')}
              </Btn>
              <Btn
                small
                onClick={() => {
                  setConfirm('');
                  setPending(null);
                }}
              >
                {L('Cancelar', 'Cancel')}
              </Btn>
            </div>
          </div>
        )}
        {msg && <div class="okmsg" style={{ marginTop: 8 }}>{msg}</div>}
        {err && <div class="error" style={{ marginTop: 8 }}>{err}</div>}
      </Card>

      <Card>
        <h2>{L('Recomeçar', 'Start over')}</h2>
        <p class="small muted">{L('Volta ao plano de exemplo (4 adultos, 7 baldes, lista do Costco). Apaga o que você registrou.', 'Goes back to the sample plan (4 adults, 7 buckets, Costco list). Erases what you recorded.')}</p>
        {confirm === 'reset' ? (
          <div class="banner">
            {L('Isto apaga seus baldes lacrados, a despensa, as compras marcadas e as metas.', 'This erases your sealed buckets, pantry, checked-off purchases and goals.')}
            <div class="row wrap" style={{ marginTop: 8 }}>
              <Btn kind="danger" small onClick={doReset}>
                {L('Sim, voltar ao plano de exemplo', 'Yes, go back to the sample plan')}
              </Btn>
              <Btn small onClick={() => setConfirm('')}>
                {L('Cancelar', 'Cancel')}
              </Btn>
            </div>
          </div>
        ) : (
          <Btn kind="danger" small onClick={() => setConfirm('reset')}>
            {L('Voltar ao plano de exemplo', 'Back to the sample plan')}
          </Btn>
        )}
      </Card>

      <div class="xs faint" style={{ textAlign: 'center', marginBottom: 16 }}>{L('KeepReady · versão de teste', 'KeepReady · test version')}</div>
    </>
  );
}
