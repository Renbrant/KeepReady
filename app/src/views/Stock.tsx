import { useState } from 'preact/hooks';
import { Btn, Card, NumField, Pill, TextField, type Tone } from '../components/ui';
import {
  bucketKcal,
  bucketKg,
  canStartRotation,
  finishRotation,
  replacementCost,
  rotationRows,
  sealBucket,
  startRotation,
  type RotRow,
  type RotStatus,
} from '../lib/calc';
import { addDays, fmtDate, todayISO } from '../lib/dates';
import { addReplacementShopping, removeReplacementShopping } from '../lib/actions';
import { saveBucket, savePantry, saveSupplies } from '../lib/db';
import { usePlan, useReadiness } from '../lib/derived';
import { gearProgress } from '../lib/planner';
import { n0, n1, usd } from '../lib/fmt';
import type { Bucket, Settings } from '../lib/types';
import { L, tx } from '../lib/i18n';

const STATUS_TONE: Record<RotStatus, Tone> = { planned: 'neutral', ok: 'ok', soon: 'warn', overdue: 'bad', rotating: 'info' };

function statusLabel(row: RotRow): string {
  switch (row.status) {
    case 'planned':
      return L('Planejado', 'Planned');
    case 'rotating':
      return L('Em rotação', 'In rotation');
    case 'overdue':
      return L('Vencido', 'Overdue');
    case 'soon':
      return L(`Vence em ${row.daysToDue} d`, `Due in ${row.daysToDue} d`);
    default:
      return L('Lacrado', 'Sealed');
  }
}

type B = Bucket & { id: string };

function BucketCard({ b, all, row, settings }: { b: B; all: B[]; row: RotRow; settings: Settings }) {
  const today = todayISO();
  const [sealDate, setSealDate] = useState(today);
  const check = canStartRotation(all, b.n);
  const cost = replacementCost(b, settings);

  const seal = () => saveBucket(b.id, sealBucket(b, sealDate, settings.rotationMonths, all.length));
  const unseal = () => saveBucket(b.id, { ...b, status: 'planned', sealedOn: undefined, dueOn: undefined, cycle: 0, rotationStartedOn: undefined });
  const start = () => {
    saveBucket(b.id, startRotation(b, today));
    addReplacementShopping(b);
  };
  const finish = () => {
    saveBucket(b.id, finishRotation(b, today, settings.rotationMonths));
    removeReplacementShopping(b.n);
  };
  const cancel = () => {
    saveBucket(b.id, { ...b, status: 'sealed', rotationStartedOn: undefined });
    removeReplacementShopping(b.n);
  };

  return (
    <details class="card">
      <summary>
        <div class="row between">
          <div>
            <b>{tx(b.name)}</b>
            <div class="xs muted mono">
              {n1(bucketKg(b))} kg · {n0(bucketKcal(b))} kcal
            </div>
          </div>
          <Pill tone={STATUS_TONE[row.status]}>{statusLabel(row)}</Pill>
        </div>
      </summary>

      <table class="t">
        <thead>
          <tr>
            <th>{L('Item', 'Item')}</th>
            <th class="num">kg</th>
            <th class="num">kcal</th>
          </tr>
        </thead>
        <tbody>
          {b.items.map((i) => (
            <tr key={i.name}>
              <td>{tx(i.name)}</td>
              <td class="num">{n1(i.kg)}</td>
              <td class="num">{n0(i.kg * i.kcalPerKg)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div class="xs muted" style={{ marginTop: 6 }}>
        {L(`${b.bags} sacos de Mylar, 1 absorvedor de oxigênio de 700 cc por saco com grãos.`, `${b.bags} Mylar bags, one 700 cc oxygen absorber per bag with grains.`)} {tx(b.note)}
      </div>

      {b.sealedOn && (
        <div class="small" style={{ marginTop: 10 }}>
          {L('Lacrado em ', 'Sealed on ')}<b>{fmtDate(b.sealedOn)}</b>{L(' · ciclo ', ' · cycle ')}{b.cycle}
          {b.dueOn && b.status === 'sealed' && (
            <>
              {' '}
              {L('· rotação até ', '· rotation by ')}<b>{fmtDate(b.dueOn)}</b>
            </>
          )}
          {b.status === 'rotating' && b.rotationStartedOn && (
            <>
              {' '}
              {L('· aberto desde ', '· open since ')}<b>{fmtDate(b.rotationStartedOn)}</b>{L(', termine até ', ', finish by ')}<b>{fmtDate(addDays(b.rotationStartedOn, settings.rotationWindowDays))}</b>
            </>
          )}
        </div>
      )}

      <div class="xs muted" style={{ marginTop: 6 }}>
        {L('Repor este balde custa cerca de ', 'Replacing this bucket costs about ')}{usd(cost.food)}
        {cost.packaging > 0 ? L(` + ${usd(cost.packaging)} de embalagem`, ` + ${usd(cost.packaging)} packaging`) : ''}
        {cost.missingPrice.length > 0 ? L(` (sem preço: ${cost.missingPrice.map(tx).join(', ')})`, ` (no price: ${cost.missingPrice.map(tx).join(', ')})`) : ''}.
      </div>

      <div class="stack" style={{ marginTop: 12 }}>
        {b.status === 'planned' && (
          <div class="row wrap">
            <div style={{ width: 160 }}>
              <TextField label={L('Data do lacre', 'Seal date')} type="date" value={sealDate} onChange={setSealDate} />
            </div>
            <Btn kind="primary" onClick={seal}>
              {L('Lacrar', 'Seal')}
            </Btn>
          </div>
        )}
        {b.status === 'sealed' && (
          <>
            <div class="row wrap">
              <Btn kind="primary" onClick={start} disabled={!check.ok}>
                {L('Iniciar rotação', 'Start rotation')}
              </Btn>
              <Btn small onClick={unseal}>
                {L('Desfazer lacre', 'Undo seal')}
              </Btn>
            </div>
            {!check.ok && <div class="xs muted">{check.reason}</div>}
          </>
        )}
        {b.status === 'rotating' && (
          <div class="row wrap">
            <Btn kind="primary" onClick={finish}>
              {L('Concluir reposição (relacrei hoje)', 'Finish replacement (resealed today)')}
            </Btn>
            <Btn small onClick={cancel}>
              {L('Cancelar rotação', 'Cancel rotation')}
            </Btn>
          </div>
        )}
      </div>
    </details>
  );
}

export function Stock() {
  const r = useReadiness();
  const plan = usePlan();
  const prog = gearProgress(plan.gearLines);
  const today = todayISO();
  const rows = rotationRows(r.buckets, today);
  const sealed = r.buckets.filter((b) => b.status === 'sealed').length;
  const planned = r.buckets.filter((b) => b.status === 'planned');

  return (
    <>
      <div class="topbar">
        <div>
          <h1>{L('Estoque', 'Stock')}</h1>
          <div class="sub">
            {sealed}{L(' de ', ' of ')}{r.buckets.length}{L(' baldes lacrados · ', ' buckets sealed · ')}{n0(r.stock.totalKcal)} kcal
          </div>
        </div>
      </div>

      <a class="menu-link" href="#/caixas">
        <span>
          {L('Caixas de 27 gal', '27-gal totes')}
          <small>
            {plan.totes.length} {plan.totes.length === 1 ? L('caixa', 'tote') : L('caixas', 'totes')} · {prog.done}{L(' de ', ' of ')}{prog.total}{L(' itens completos', ' items complete')}
          </small>
        </span>
        <span aria-hidden="true">›</span>
      </a>

      <h2>{L('Baldes', 'Buckets')}</h2>
      {r.buckets.map((b) => (
        <BucketCard key={b.id} b={b} all={r.buckets} row={rows.find((x) => x.bucket.n === b.n)!} settings={r.settings} />
      ))}
      {planned.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <Btn small onClick={() => planned.forEach((b) => saveBucket(b.id, sealBucket(b, today, r.settings.rotationMonths, r.buckets.length)))}>
            {L(`Marcar os ${planned.length} baldes restantes como lacrados hoje`, `Mark the remaining ${planned.length} buckets as sealed today`)}
          </Btn>
        </div>
      )}

      <h2>{L('Despensa', 'Pantry')}</h2>
      <Card>
        <ul class="list">
          {r.pantry.map((p) => (
            <li key={p.id}>
              <div class="row between" style={{ alignItems: 'flex-start' }}>
                <div class="grow">
                  <div style={{ fontWeight: 600 }}>{tx(p.name)}</div>
                  <div class="xs muted mono">
                    {L('plano: ', 'plan: ')}{n1(p.planQty)} {tx(p.unit)} ({n0(p.planQty * p.kcalPerUnit)} kcal){L(' · tenho ', ' · have ')}{n0(p.haveQty * p.kcalPerUnit)} kcal
                  </div>
                </div>
              </div>
              <div class="grid2" style={{ marginTop: 8 }}>
                <NumField label={L(`Tenho (${tx(p.unit)})`, `I have (${tx(p.unit)})`)} value={p.haveQty} min={0} onChange={(v) => savePantry(p.id, { haveQty: v ?? 0 })} />
                <TextField label={L('Validade', 'Expiry date')} type="date" value={p.expiresOn ?? ''} onChange={(v) => savePantry(p.id, { expiresOn: v || undefined })} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <a class="menu-link" href="#/agua">
        <span>
          {L('Água: potável e limpa, com validade', 'Water: drinking and clean, with expiry dates')}
          <small>
            {n0(r.water.potableGal)}{L(' gal potável · ', ' gal drinking · ')}{n0(r.water.cleanGal)}{L(' gal limpa', ' gal clean')}{r.water.expiredGal > 0 ? L(` · ${n0(r.water.expiredGal)} vencidos`, ` · ${n0(r.water.expiredGal)} expired`) : ''}
          </small>
        </span>
        <span aria-hidden="true">›</span>
      </a>

      <h2>{L('Água e gás', 'Water and gas')}</h2>
      <Card>
        <div class="grid2">
          {r.water.hasLots ? (
            <div>
              <div class="xs muted">{L('Água potável guardada', 'Drinking water stored')}</div>
              <div class="mono" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{n0(r.water.potableGal)} gal</div>
              <a href="#/agua" class="xs">{L('Ver lotes e validade', 'See batches and expiry dates')}</a>
            </div>
          ) : (
            <NumField label={L('Água guardada', 'Stored water')} suffix="gal" value={r.sup.waterGal} min={0} onChange={(v) => saveSupplies({ waterGal: v ?? 0 })} />
          )}
          <NumField label={L('Meta de água', 'Water goal')} suffix="gal" value={r.sup.waterTargetGal} min={0} onChange={(v) => saveSupplies({ waterTargetGal: v ?? 0 })} />
          <NumField label={L('Botijões cheios (20 lb)', 'Full cylinders (20 lb)')} value={r.sup.propaneFull} min={0} step={1} onChange={(v) => saveSupplies({ propaneFull: v ?? 0 })} />
          <NumField label={L('Meta de botijões', 'Cylinder goal')} value={r.sup.propaneTarget} min={0} step={1} onChange={(v) => saveSupplies({ propaneTarget: v ?? 0 })} />
        </div>
        <p class="xs muted" style={{ marginTop: 10, marginBottom: 0 }}>
          {L(`Para ${r.members.length} pessoas, ${r.settings.daysTarget} dias e ${n0(r.settings.altitudeFt)} pés de altitude, o app calcula cerca de`, `For ${r.members.length} people, ${r.settings.daysTarget} days and ${n0(r.settings.altitudeFt)} ft of altitude, the app calculates about`)}{' '}
          <b>{n0(r.waterNeedGal)} gal</b>{L(' de água e ', ' of water and ')}<b>{r.cylindersNeed} {L('botijões', 'cylinders')}</b>{L(' de 20 lb (com 20% de folga, ', ' of 20 lb (with 20% margin, ')}{r.settings.cookingMode === 'pressure' ? L('usando panela de pressão', 'using a pressure cooker') : L('sem panela de pressão', 'without a pressure cooker')}{L('). Veja a base dessas contas em Guias.', '). See the basis for these calculations in Guides.')}
        </p>
      </Card>
    </>
  );
}
