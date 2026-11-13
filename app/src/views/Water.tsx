import { useState } from 'preact/hooks';
import { Btn, Card, NumField, Pill, SelectField, TextField } from '../components/ui';
import { GAL_L, TAP_WATER_MONTHS, lotExpiry } from '../lib/calc';
import { diffDays, fmtDate, todayISO } from '../lib/dates';
import { saveSettings, saveWater, store, useSupplies } from '../lib/db';
import { useReadiness } from '../lib/derived';
import { n0 } from '../lib/fmt';
import { newId } from '../lib/store';
import type { WaterLot } from '../lib/types';

type Lot = WaterLot & { id: string };

const TYPE_OPTS = [
  { value: 'potavel' as const, label: 'Potável (beber e cozinhar)' },
  { value: 'limpa' as const, label: 'Limpa (higiene, louça, descarga)' },
];
const ORIGIN_OPTS = [
  { value: 'engarrafada' as const, label: 'Engarrafada (validade impressa)' },
  { value: 'torneira' as const, label: 'Da torneira, enchi eu' },
];

function status(l: Lot, today: string): { tone: 'bad' | 'warn' | 'ok' | 'neutral'; text: string } {
  const exp = lotExpiry(l);
  if (!exp) return { tone: 'neutral', text: 'Sem validade' };
  const d = diffDays(today, exp);
  if (d < 0) return { tone: 'bad', text: `Vencida em ${fmtDate(exp)}` };
  if (d <= 60) return { tone: 'warn', text: `Vence em ${d} dias` };
  return { tone: 'ok', text: `Vence em ${fmtDate(exp)}` };
}

function LotCard({ l, today }: { l: Lot; today: string }) {
  const [open, setOpen] = useState(false);
  const st = status(l, today);
  return (
    <li>
      <div class="row" style={{ alignItems: 'flex-start' }}>
        <div class="grow">
          <div style={{ fontWeight: 600 }}>{l.name}</div>
          <div class="xs muted mono">
            {n0(l.gal)} gal · {l.type === 'potavel' ? 'potável' : 'limpa'} · {l.origin === 'engarrafada' ? 'engarrafada' : 'da torneira'}
          </div>
          <div class="row wrap" style={{ marginTop: 4, gap: 6 }}>
            <Pill tone={st.tone}>{st.text}</Pill>
            {l.type === 'limpa' && <Pill tone="info">Não beber</Pill>}
          </div>
        </div>
        <Btn small onClick={() => setOpen(!open)}>
          {open ? 'Fechar' : 'Editar'}
        </Btn>
      </div>
      {open && (
        <div class="grid2" style={{ marginTop: 10 }}>
          <TextField label="Nome" value={l.name} onChange={(v) => saveWater(l.id, { name: v })} />
          <NumField label="Galões" value={l.gal} min={0} step={1} onChange={(v) => saveWater(l.id, { gal: Math.max(0, v ?? 0) })} />
          <SelectField label="Tipo" value={l.type} options={TYPE_OPTS} onChange={(v) => saveWater(l.id, { type: v })} />
          <SelectField label="Origem" value={l.origin} options={ORIGIN_OPTS} onChange={(v) => saveWater(l.id, { origin: v })} />
          <TextField label="Data de enchimento" type="date" value={l.filledOn ?? ''} onChange={(v) => saveWater(l.id, { filledOn: v || undefined })} />
          <TextField label="Validade (se impressa)" type="date" value={l.expiresOn ?? ''} onChange={(v) => saveWater(l.id, { expiresOn: v || undefined })} />
          <div style={{ gridColumn: '1 / -1' }} class="row wrap">
            {l.origin === 'torneira' && (
              <Btn small onClick={() => saveWater(l.id, { filledOn: todayISO(), expiresOn: undefined })}>
                Renovei hoje
              </Btn>
            )}
            <Btn small kind="danger" onClick={() => store.remove(l.id)}>
              Remover lote
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
          <h1>Água</h1>
          <div class="sub">Potável e limpa, com vencimento</div>
        </div>
      </div>

      <Card>
        <div class="grid2">
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
              {n0(w.potableGal)} <span class="small muted">de {n0(potTarget)} gal</span>
            </div>
            <div class="xs muted">potável: beber e cozinhar</div>
          </div>
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
              {n0(w.cleanGal)} <span class="small muted">de {n0(r.cleanNeedGal)} gal</span>
            </div>
            <div class="xs muted">limpa: higiene, louça, descarga</div>
          </div>
        </div>
        {w.expiredGal > 0 && (
          <div class="small" style={{ marginTop: 10 }}>
            <Pill tone="bad">{n0(w.expiredGal)} gal vencidos</Pill> Não contam no total. Renove ou remova os lotes vencidos.
          </div>
        )}
        {w.soonGal > 0 && (
          <div class="small" style={{ marginTop: 8 }}>
            <Pill tone="warn">{n0(w.soonGal)} gal vencem em até 60 dias</Pill>
          </div>
        )}
        <p class="xs faint" style={{ marginTop: 10, marginBottom: 0 }}>
          Só contam lotes que ainda não venceram. A meta potável vem do plano (1 gal por pessoa por dia para beber, mais a água de cozinhar). A de água limpa é uma estimativa sua: ajuste abaixo.
        </p>
      </Card>

      {!w.hasLots && raw.waterGal > 0 && (
        <Card tone="warn">
          <div class="small">
            Você já tinha <b>{n0(raw.waterGal)} gal</b> anotados como "Água guardada". Para controlar vencimento, crie um lote com essa quantidade.
          </div>
          <div style={{ marginTop: 8 }}>
            <Btn
              small
              kind="primary"
              onClick={() => store.put('water', newId('water'), { name: 'Água que eu já tinha', gal: raw.waterGal, type: 'potavel', origin: 'engarrafada', order: 1 } satisfies WaterLot)}
            >
              Criar lote inicial
            </Btn>
          </div>
        </Card>
      )}

      <h2>Potável</h2>
      <Card>
        {potable.length === 0 ? <div class="small muted">Nenhum lote ainda.</div> : (
          <ul class="list">
            {potable.map((l) => <LotCard key={l.id} l={l} today={today} />)}
          </ul>
        )}
      </Card>

      <h2>Limpa (não beber)</h2>
      <Card>
        {clean.length === 0 ? <div class="small muted">Nenhum lote ainda. Serve para lavar as mãos, a louça e a descarga.</div> : (
          <ul class="list">
            {clean.map((l) => <LotCard key={l.id} l={l} today={today} />)}
          </ul>
        )}
        <div style={{ marginTop: 10, maxWidth: 220 }}>
          <NumField
            label="Água limpa por pessoa por dia"
            suffix="gal"
            value={Math.round(cleanGalPerDay * 100) / 100}
            min={0}
            step={0.25}
            onChange={(v) => saveSettings({ cleanLPerPersonDay: Math.max(0, (v ?? 0) * GAL_L) })}
          />
        </div>
        <div class="xs faint">Padrão de meio galão: é uma estimativa do app, não uma regra oficial.</div>
      </Card>

      <h2>Novo lote</h2>
      <Card>
        <div class="grid2">
          <TextField label="Nome" value={name} onChange={setName} />
          <NumField label="Galões" value={gal} min={0} step={1} onChange={setGal} />
          <SelectField label="Tipo" value={type} options={TYPE_OPTS} onChange={setType} />
          <SelectField label="Origem" value={origin} options={ORIGIN_OPTS} onChange={setOrigin} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Btn kind="primary" onClick={add}>
            Adicionar lote
          </Btn>
        </div>
        <p class="xs faint" style={{ marginBottom: 0 }}>
          Água da torneira guardada por você: o app sugere trocar após {TAP_WATER_MONTHS} meses (prazo comum de recomendação; confira na fonte). Engarrafada: digite a validade impressa no jarro, em Editar.
        </p>
      </Card>
    </>
  );
}
