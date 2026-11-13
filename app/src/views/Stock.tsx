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

const STATUS_TONE: Record<RotStatus, Tone> = { planned: 'neutral', ok: 'ok', soon: 'warn', overdue: 'bad', rotating: 'info' };

function statusLabel(row: RotRow): string {
  switch (row.status) {
    case 'planned':
      return 'Planejado';
    case 'rotating':
      return 'Em rotação';
    case 'overdue':
      return 'Vencido';
    case 'soon':
      return `Vence em ${row.daysToDue} d`;
    default:
      return 'Lacrado';
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
            <b>{b.name}</b>
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
            <th>Item</th>
            <th class="num">kg</th>
            <th class="num">kcal</th>
          </tr>
        </thead>
        <tbody>
          {b.items.map((i) => (
            <tr key={i.name}>
              <td>{i.name}</td>
              <td class="num">{n1(i.kg)}</td>
              <td class="num">{n0(i.kg * i.kcalPerKg)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div class="xs muted" style={{ marginTop: 6 }}>
        {b.bags} sacos de Mylar, 1 absorvedor de oxigênio de 500 cc por saco com grãos. {b.note}
      </div>

      {b.sealedOn && (
        <div class="small" style={{ marginTop: 10 }}>
          Lacrado em <b>{fmtDate(b.sealedOn)}</b> · ciclo {b.cycle}
          {b.dueOn && b.status === 'sealed' && (
            <>
              {' '}
              · rotação até <b>{fmtDate(b.dueOn)}</b>
            </>
          )}
          {b.status === 'rotating' && b.rotationStartedOn && (
            <>
              {' '}
              · aberto desde <b>{fmtDate(b.rotationStartedOn)}</b>, termine até <b>{fmtDate(addDays(b.rotationStartedOn, settings.rotationWindowDays))}</b>
            </>
          )}
        </div>
      )}

      <div class="xs muted" style={{ marginTop: 6 }}>
        Repor este balde custa cerca de {usd(cost.food)}
        {cost.packaging > 0 ? ` + ${usd(cost.packaging)} de embalagem` : ''}
        {cost.missingPrice.length > 0 ? ` (sem preço: ${cost.missingPrice.join(', ')})` : ''}.
      </div>

      <div class="stack" style={{ marginTop: 12 }}>
        {b.status === 'planned' && (
          <div class="row wrap">
            <div style={{ width: 160 }}>
              <TextField label="Data do lacre" type="date" value={sealDate} onChange={setSealDate} />
            </div>
            <Btn kind="primary" onClick={seal}>
              Lacrar
            </Btn>
          </div>
        )}
        {b.status === 'sealed' && (
          <>
            <div class="row wrap">
              <Btn kind="primary" onClick={start} disabled={!check.ok}>
                Iniciar rotação
              </Btn>
              <Btn small onClick={unseal}>
                Desfazer lacre
              </Btn>
            </div>
            {!check.ok && <div class="xs muted">{check.reason}</div>}
          </>
        )}
        {b.status === 'rotating' && (
          <div class="row wrap">
            <Btn kind="primary" onClick={finish}>
              Concluir reposição (relacrei hoje)
            </Btn>
            <Btn small onClick={cancel}>
              Cancelar rotação
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
          <h1>Estoque</h1>
          <div class="sub">
            {sealed} de {r.buckets.length} baldes lacrados · {n0(r.stock.totalKcal)} kcal
          </div>
        </div>
      </div>

      <a class="menu-link" href="#/caixas">
        <span>
          Caixas de 27 gal
          <small>
            {plan.totes.length} {plan.totes.length === 1 ? 'caixa' : 'caixas'} · {prog.done} de {prog.total} itens completos
          </small>
        </span>
        <span aria-hidden="true">›</span>
      </a>

      <h2>Baldes</h2>
      {r.buckets.map((b) => (
        <BucketCard key={b.id} b={b} all={r.buckets} row={rows.find((x) => x.bucket.n === b.n)!} settings={r.settings} />
      ))}
      {planned.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <Btn small onClick={() => planned.forEach((b) => saveBucket(b.id, sealBucket(b, today, r.settings.rotationMonths, r.buckets.length)))}>
            Marcar os {planned.length} baldes restantes como lacrados hoje
          </Btn>
        </div>
      )}

      <h2>Despensa</h2>
      <Card>
        <ul class="list">
          {r.pantry.map((p) => (
            <li key={p.id}>
              <div class="row between" style={{ alignItems: 'flex-start' }}>
                <div class="grow">
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div class="xs muted mono">
                    plano: {n1(p.planQty)} {p.unit} ({n0(p.planQty * p.kcalPerUnit)} kcal) · tenho {n0(p.haveQty * p.kcalPerUnit)} kcal
                  </div>
                </div>
              </div>
              <div class="grid2" style={{ marginTop: 8 }}>
                <NumField label={`Tenho (${p.unit})`} value={p.haveQty} min={0} onChange={(v) => savePantry(p.id, { haveQty: v ?? 0 })} />
                <TextField label="Validade" type="date" value={p.expiresOn ?? ''} onChange={(v) => savePantry(p.id, { expiresOn: v || undefined })} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <h2>Água e gás</h2>
      <Card>
        <div class="grid2">
          <NumField label="Água guardada" suffix="gal" value={r.sup.waterGal} min={0} onChange={(v) => saveSupplies({ waterGal: v ?? 0 })} />
          <NumField label="Meta de água" suffix="gal" value={r.sup.waterTargetGal} min={0} onChange={(v) => saveSupplies({ waterTargetGal: v ?? 0 })} />
          <NumField label="Botijões cheios (20 lb)" value={r.sup.propaneFull} min={0} step={1} onChange={(v) => saveSupplies({ propaneFull: v ?? 0 })} />
          <NumField label="Meta de botijões" value={r.sup.propaneTarget} min={0} step={1} onChange={(v) => saveSupplies({ propaneTarget: v ?? 0 })} />
        </div>
        <p class="xs muted" style={{ marginTop: 10, marginBottom: 0 }}>
          Para {r.members.length} pessoas, {r.settings.daysTarget} dias e {n0(r.settings.altitudeFt)} pés de altitude, o app calcula cerca de{' '}
          <b>{n0(r.waterNeedGal)} gal</b> de água e <b>{r.cylindersNeed} botijões</b> de 20 lb (com 20% de folga, {r.settings.cookingMode === 'pressure' ? 'usando panela de pressão' : 'sem panela de pressão'}). Veja a base dessas contas em Guias.
        </p>
      </Card>
    </>
  );
}
