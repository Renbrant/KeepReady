import { useState } from 'preact/hooks';
import { Btn, Card, NumField, Pill, SelectField, TextField } from '../components/ui';
import { GAL_L, TAP_WATER_MONTHS, lotExpiry } from '../lib/calc';
import { diffDays, fmtDate, todayISO } from '../lib/dates';
import { saveSettings, saveWater, store, useSupplies } from '../lib/db';
import { useReadiness } from '../lib/derived';
import { n0 } from '../lib/fmt';
import { newId } from '../lib/store';
import type { WaterLot } from '../lib/types';
import { L, tx } from '../lib/i18n';

type Lot = WaterLot & { id: string };

const typeOpts = () => [
  { value: 'potavel' as const, label: L('Potável (beber e cozinhar)', 'Drinking (drink and cook)') },
  { value: 'limpa' as const, label: L('Limpa (higiene, louça, descarga)', 'Clean (hygiene, dishes, flushing)') },
];
const originOpts = () => [
  { value: 'engarrafada' as const, label: L('Engarrafada (validade impressa)', 'Bottled (printed expiry date)') },
  { value: 'torneira' as const, label: L('Da torneira, enchi eu', 'From the tap, filled by me') },
];

function status(l: Lot, today: string): { tone: 'bad' | 'warn' | 'ok' | 'neutral'; text: string } {
  const exp = lotExpiry(l);
  if (!exp) return { tone: 'neutral', text: L('Sem validade', 'No expiry date') };
  const d = diffDays(today, exp);
  if (d < 0) return { tone: 'bad', text: L(`Vencida em ${fmtDate(exp)}`, `Expired on ${fmtDate(exp)}`) };
  if (d <= 60) return { tone: 'warn', text: L(`Vence em ${d} dias`, `Expires in ${d} days`) };
  return { tone: 'ok', text: L(`Vence em ${fmtDate(exp)}`, `Expires on ${fmtDate(exp)}`) };
}

function LotCard({ l, today }: { l: Lot; today: string }) {
  const [open, setOpen] = useState(false);
  const st = status(l, today);
  return (
    <li>
      <div class="row" style={{ alignItems: 'flex-start' }}>
        <div class="grow">
          <div style={{ fontWeight: 600 }}>{tx(l.name)}</div>
          <div class="xs muted mono">
            {n0(l.gal)} gal · {l.type === 'potavel' ? L('potável', 'drinking') : L('limpa', 'clean')} · {l.origin === 'engarrafada' ? L('engarrafada', 'bottled') : L('da torneira', 'tap')}
          </div>
          <div class="row wrap" style={{ marginTop: 4, gap: 6 }}>
            <Pill tone={st.tone}>{st.text}</Pill>
            {l.type === 'limpa' && <Pill tone="info">{L('Não beber', 'Do not drink')}</Pill>}
          </div>
        </div>
        <Btn small onClick={() => setOpen(!open)}>
          {open ? L('Fechar', 'Close') : L('Editar', 'Edit')}
        </Btn>
      </div>
      {open && (
        <div class="grid2" style={{ marginTop: 10 }}>
          <TextField label={L('Nome', 'Name')} value={l.name} onChange={(v) => saveWater(l.id, { name: v })} />
          <NumField label={L('Galões', 'Gallons')} value={l.gal} min={0} step={1} onChange={(v) => saveWater(l.id, { gal: Math.max(0, v ?? 0) })} />
          <SelectField label={L('Tipo', 'Type')} value={l.type} options={typeOpts()} onChange={(v) => saveWater(l.id, { type: v })} />
          <SelectField label={L('Origem', 'Source')} value={l.origin} options={originOpts()} onChange={(v) => saveWater(l.id, { origin: v })} />
          <TextField label={L('Data de enchimento', 'Fill date')} type="date" value={l.filledOn ?? ''} onChange={(v) => saveWater(l.id, { filledOn: v || undefined })} />
          <TextField label={L('Validade (se impressa)', 'Expiry date (if printed)')} type="date" value={l.expiresOn ?? ''} onChange={(v) => saveWater(l.id, { expiresOn: v || undefined })} />
          <div style={{ gridColumn: '1 / -1' }} class="row wrap">
            {l.origin === 'torneira' && (
              <Btn small onClick={() => saveWater(l.id, { filledOn: todayISO(), expiresOn: undefined })}>
                {L('Renovei hoje', 'Renewed today')}
              </Btn>
            )}
            <Btn small kind="danger" onClick={() => store.remove(l.id)}>
              {L('Remover lote', 'Remove batch')}
            </Btn>
          </div>
        </div>
      )}
    </li>
  );
}

export function Water() {
  const r = useReadiness();
  const raw = useSupplies();
  const today = todayISO();
  const lots = r.waterLots as Lot[];
  const [name, setName] = useState('');
  const [gal, setGal] = useState<number | undefined>(1);
  const [type, setType] = useState<WaterLot['type']>('potavel');
  const [origin, setOrigin] = useState<WaterLot['origin']>('engarrafada');

  const add = () => {
    if (!name.trim() || !gal) return;
    const order = lots.reduce((m, x) => Math.max(m, x.order), 0) + 1;
    store.put('water', newId('water'), { name: name.trim(), gal, type, origin, filledOn: origin === 'torneira' ? today : undefined, order } satisfies WaterLot);
    setName('');
  };

  const w = r.water;
  const potTarget = r.sup.waterTargetGal;
  const potable = lots.filter((l) => l.type === 'potavel');
  const clean = lots.filter((l) => l.type === 'limpa');
  const cleanGalPerDay = r.settings.cleanLPerPersonDay / GAL_L;

  return (
    <>
      <div class="topbar">
        <div>
          <h1>{L('Água', 'Water')}</h1>
          <div class="sub">{L('Potável e limpa, com vencimento', 'Drinking and clean, with expiry dates')}</div>
        </div>
      </div>

      <Card>
        <div class="grid2">
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
              {n0(w.potableGal)} <span class="small muted">{L('de ', 'of ')}{n0(potTarget)} gal</span>
            </div>
            <div class="xs muted">{L('potável: beber e cozinhar', 'drinking: to drink and cook')}</div>
          </div>
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
              {n0(w.cleanGal)} <span class="small muted">{L('de ', 'of ')}{n0(r.cleanNeedGal)} gal</span>
            </div>
            <div class="xs muted">{L('limpa: higiene, louça, descarga', 'clean: hygiene, dishes, flushing')}</div>
          </div>
        </div>
        {w.expiredGal > 0 && (
          <div class="small" style={{ marginTop: 10 }}>
            <Pill tone="bad">{n0(w.expiredGal)} {L('gal vencidos', 'gal expired')}</Pill> {L('Não contam no total. Renove ou remova os lotes vencidos.', 'They do not count toward the total. Renew or remove expired batches.')}
          </div>
        )}
        {w.soonGal > 0 && (
          <div class="small" style={{ marginTop: 8 }}>
            <Pill tone="warn">{n0(w.soonGal)} {L('gal vencem em até 60 dias', 'gal expire within 60 days')}</Pill>
          </div>
        )}
        <p class="xs faint" style={{ marginTop: 10, marginBottom: 0 }}>
          {L('Só contam lotes que ainda não venceram. A meta potável vem do plano (1 gal por pessoa por dia para beber, mais a água de cozinhar). A de água limpa é uma estimativa sua: ajuste abaixo.', 'Only batches that have not expired count. The drinking goal comes from the plan (drinking water per person per day plus cooking water). The clean-water goal is your own estimate: adjust it below.')}
        </p>
      </Card>

      {!w.hasLots && raw.waterGal > 0 && (
        <Card tone="warn">
          <div class="small">
            {L('Você já tinha ', 'You already had ')}<b>{n0(raw.waterGal)} gal</b>{L(' anotados como "Água guardada". Para controlar vencimento, crie um lote com essa quantidade.', ' noted as "Stored water". To track expiry, create a batch with that amount.')}
          </div>
          <div style={{ marginTop: 8 }}>
            <Btn
              small
              kind="primary"
              onClick={() => store.put('water', newId('water'), { name: L('Água que eu já tinha', 'Water I already had'), gal: raw.waterGal, type: 'potavel', origin: 'engarrafada', order: 1 } satisfies WaterLot)}
            >
              {L('Criar lote inicial', 'Create starting batch')}
            </Btn>
          </div>
        </Card>
      )}

      <h2>{L('Potável', 'Drinking')}</h2>
      <Card>
        {potable.length === 0 ? <div class="small muted">{L('Nenhum lote ainda.', 'No batches yet.')}</div> : (
          <ul class="list">
            {potable.map((l) => <LotCard key={l.id} l={l} today={today} />)}
          </ul>
        )}
      </Card>

      <h2>{L('Limpa (não beber)', 'Clean (do not drink)')}</h2>
      <Card>
        {clean.length === 0 ? <div class="small muted">{L('Nenhum lote ainda. Serve para lavar as mãos, a louça e a descarga.', 'No batches yet. For washing hands, dishes and flushing.')}</div> : (
          <ul class="list">
            {clean.map((l) => <LotCard key={l.id} l={l} today={today} />)}
          </ul>
        )}
        <div style={{ marginTop: 10, maxWidth: 220 }}>
          <NumField
            label={L('Água limpa por pessoa por dia', 'Clean water per person per day')}
            suffix="gal"
            value={Math.round(cleanGalPerDay * 100) / 100}
            min={0}
            step={0.25}
            onChange={(v) => saveSettings({ cleanLPerPersonDay: Math.max(0, (v ?? 0) * GAL_L) })}
          />
        </div>
        <div class="xs faint">{L('Padrão de meio galão: é uma estimativa do app, não uma regra oficial.', 'Default of half a gallon: this is an app estimate, not an official rule.')}</div>
      </Card>

      <h2>{L('Novo lote', 'New batch')}</h2>
      <Card>
        <div class="grid2">
          <TextField label={L('Nome', 'Name')} value={name} onChange={setName} />
          <NumField label={L('Galões', 'Gallons')} value={gal} min={0} step={1} onChange={setGal} />
          <SelectField label={L('Tipo', 'Type')} value={type} options={typeOpts()} onChange={setType} />
          <SelectField label={L('Origem', 'Source')} value={origin} options={originOpts()} onChange={setOrigin} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Btn kind="primary" onClick={add}>
            {L('Adicionar lote', 'Add batch')}
          </Btn>
        </div>
        <p class="xs faint" style={{ marginBottom: 0 }}>
          {L('Água da torneira guardada por você: o app sugere trocar após ', 'Tap water you store yourself: the app suggests replacing it after ')}{TAP_WATER_MONTHS}{L(' meses (prazo comum de recomendação; confira na fonte). Engarrafada: digite a validade impressa no jarro, em Editar.', ' months (a common recommended interval; check the source). Bottled: enter the expiry date printed on the jug, under Edit.')}
        </p>
      </Card>
    </>
  );
}
