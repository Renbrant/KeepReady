import { SyncPill, agoLabel } from '../components/SyncPill';
import { Card, Gauge, Pill, Ring, toneFor, type Tone } from '../components/ui';
import { cylindersNeeded, expiringSoon, lotExpiry, nextDue, rotationRows, type RotStatus } from '../lib/calc';
import { addDays, diffDays, fmtDate, todayISO } from '../lib/dates';
import { usePlan, useReadiness } from '../lib/derived';
import { activeLines, gearProgress } from '../lib/planner';
import { daysFmt, isStandalone, n0, n1, plural, usd } from '../lib/fmt';
import { useMeta } from '../lib/meta';
import { syncAvailable } from '../lib/supabase';
import { L, tx } from '../lib/i18n';

const STATUS_TONE: Record<RotStatus, Tone> = { planned: 'neutral', ok: 'ok', soon: 'warn', overdue: 'bad', rotating: 'info' };
const STATUS_LABEL: Record<RotStatus, string> = {
  get planned() { return L('Planejado', 'Planned'); },
  get ok() { return L('Lacrado', 'Sealed'); },
  get soon() { return L('Vence em breve', 'Due soon'); },
  get overdue() { return L('Vencido', 'Overdue'); },
  get rotating() { return L('Em rotação', 'Rotating'); },
};
const PILLAR_LABEL = {
  get food() { return L('Comida', 'Food'); },
  get water() { return L('Água', 'Water'); },
  get gas() { return L('Gás', 'Gas'); },
};

interface Alert {
  tone: 'bad' | 'warn';
  text: string;
  href?: string;
}

export function Dashboard() {
  const r = useReadiness();
  const plan = usePlan();
  const gear = gearProgress(plan.gearLines);
  const meta = useMeta();
  const today = todayISO();
  const target = r.settings.daysTarget;
  const rows = rotationRows(r.buckets, today);
  const next = nextDue(rows);
  const rotating = rows.find((x) => x.status === 'rotating');
  const sealedCount = r.buckets.filter((b) => b.status === 'sealed').length;
  const tone = toneFor(r.a.min, target);
  const noStock = r.stock.totalKcal === 0;

  /* ----- alertas ----- */
  const alerts: Alert[] = [];
  for (const row of rows) {
    if (row.status === 'overdue') alerts.push({ tone: 'bad', text: L(`${tx(row.bucket.name)} passou do prazo de rotação há ${Math.abs(row.daysToDue ?? 0)} dias.`, `${tx(row.bucket.name)} is ${Math.abs(row.daysToDue ?? 0)} days past its rotation deadline.`), href: '#/rotacao' });
    if (row.status === 'soon') alerts.push({ tone: 'warn', text: L(`${tx(row.bucket.name)}: rotação em ${row.daysToDue} dias (${fmtDate(row.dueOn)}).`, `${tx(row.bucket.name)}: rotation in ${row.daysToDue} days (${fmtDate(row.dueOn)}).`), href: '#/rotacao' });
    if (row.status === 'rotating' && row.bucket.rotationStartedOn) {
      const deadline = addDays(row.bucket.rotationStartedOn, r.settings.rotationWindowDays);
      if (deadline < today) alerts.push({ tone: 'warn', text: L(`${tx(row.bucket.name)} está aberto desde ${fmtDate(row.bucket.rotationStartedOn)}. Conclua a reposição.`, `${tx(row.bucket.name)} has been open since ${fmtDate(row.bucket.rotationStartedOn)}. Finish the replacement.`), href: '#/rotacao' });
    }
  }
  for (const p of expiringSoon(r.pantry, today)) {
    const d = diffDays(today, p.expiresOn!);
    alerts.push({ tone: d < 0 ? 'bad' : 'warn', text: d < 0 ? L(`${tx(p.name)} venceu em ${fmtDate(p.expiresOn)}.`, `${tx(p.name)} expired on ${fmtDate(p.expiresOn)}.`) : L(`${tx(p.name)} vence em ${d} dias.`, `${tx(p.name)} expires in ${d} days.`), href: '#/estoque' });
  }
  for (const g of activeLines(plan.gearLines)) {
    if (g.have <= 0 || !g.expiresOn) continue;
    const d = diffDays(today, g.expiresOn);
    if (d <= 90) alerts.push({ tone: d < 0 ? 'bad' : 'warn', text: d < 0 ? L(`${g.name} (caixas) venceu em ${fmtDate(g.expiresOn)}.`, `${g.name} (totes) expired on ${fmtDate(g.expiresOn)}.`) : L(`${g.name} (caixas) vence em ${d} dias.`, `${g.name} (totes) expires in ${d} days.`), href: '#/caixas' });
  }
  for (const l of r.waterLots) {
    const exp = lotExpiry(l);
    if (!exp) continue;
    const d = diffDays(today, exp);
    if (d <= 30) alerts.push({ tone: d < 0 ? 'bad' : 'warn', text: d < 0 ? L(`Água "${l.name}" venceu em ${fmtDate(exp)}.`, `Water "${l.name}" expired on ${fmtDate(exp)}.`) : L(`Água "${l.name}" vence em ${d} dias.`, `Water "${l.name}" expires in ${d} days.`), href: '#/agua' });
  }
  if (!noStock && r.a.min < target) {
    alerts.push({ tone: r.a.min < target / 2 ? 'bad' : 'warn', text: L(`${PILLAR_LABEL[r.a.limiting]} cobre só ${daysFmt(r.a.min)} dos ${target} dias da meta.`, `${PILLAR_LABEL[r.a.limiting]} covers only ${daysFmt(r.a.min)} of the ${target}-day goal.`), href: '#/estoque' });
  }
  if (meta.persisted === false && !isStandalone()) {
    alerts.push({ tone: 'warn', text: L('O navegador pode apagar os dados do app. Instale na tela inicial e exporte um backup.', 'The browser may erase the app’s data. Install it on the home screen and export a backup.'), href: '#/ajustes' });
  }
  if (meta.householdId && meta.lastSyncAt && Date.now() - Date.parse(meta.lastSyncAt) > 3 * 86400000) {
    alerts.push({ tone: 'warn', text: L(`Sem sincronizar ${agoLabel(meta.lastSyncAt)}. Abra o app com internet.`, `Not synced ${agoLabel(meta.lastSyncAt)}. Open the app with internet.`), href: '#/familia' });
  }

  /* ----- próximos passos ----- */
  const shopDone = r.shop.filter((s) => s.checked && s.store !== 'Reposição').length;
  const shopTotal = r.shop.filter((s) => s.store !== 'Reposição').length;
  const shopLeft = r.shop.filter((s) => !s.checked).reduce((sum, s) => sum + (s.unitPrice ?? 0) * s.qty, 0);
  const pantryDone = r.pantry.filter((p) => p.haveQty >= p.planQty).length;
  const inRotationOrSealed = r.buckets.filter((b) => b.status !== 'planned').length;
  const waterOk = r.sup.waterGal >= r.sup.waterTargetGal;
  const gasOk = r.sup.propaneFull >= r.sup.propaneTarget;
  const steps = [
    { done: r.settings.planConfigured, title: L('Planejar: pessoas, dias e perfil', 'Plan: people, days and profile'), detail: r.settings.planConfigured ? L(`${r.members.length} ${plural(r.members.length, 'pessoa', 'pessoas')} · ${target} dias de meta`, `${r.members.length} ${plural(r.members.length, 'person', 'people')} · ${target}-day goal`) : L('Comece aqui: o app calcula comida, baldes, água, gás e caixas', 'Start here: the app calculates food, buckets, water, gas and totes'), href: '#/plano' },
    { done: shopTotal > 0 && shopDone === shopTotal, title: L('Comprar os itens', 'Buy the items'), detail: L(`${shopDone} de ${shopTotal} comprados`, `${shopDone} of ${shopTotal} bought`), href: '#/compras' },
    { done: inRotationOrSealed === r.buckets.length, title: L('Reembalar e lacrar os baldes', 'Repack and seal the buckets'), detail: L(`${inRotationOrSealed} de ${r.buckets.length} lacrados`, `${inRotationOrSealed} of ${r.buckets.length} sealed`), href: '#/estoque' },
    { done: pantryDone === r.pantry.length, title: L('Montar a despensa', 'Build the pantry'), detail: L(`${pantryDone} de ${r.pantry.length} itens completos`, `${pantryDone} of ${r.pantry.length} items complete`), href: '#/estoque' },
    { done: gear.total > 0 && gear.done === gear.total, title: L('Montar as caixas de 27 gal', 'Pack the 27-gal totes'), detail: L(`${gear.done} de ${gear.total} itens completos · ${plan.totes.length} ${plan.totes.length === 1 ? 'caixa' : 'caixas'}`, `${gear.done} of ${gear.total} items complete · ${plan.totes.length} ${plan.totes.length === 1 ? 'tote' : 'totes'}`), href: '#/caixas' },
    { done: waterOk && gasOk, title: L('Água e gás', 'Water and gas'), detail: L(`${n0(r.sup.waterGal)} de ${n0(r.sup.waterTargetGal)} gal · ${r.sup.propaneFull} de ${r.sup.propaneTarget} botijões`, `${n0(r.sup.waterGal)} of ${n0(r.sup.waterTargetGal)} gal · ${r.sup.propaneFull} of ${r.sup.propaneTarget} cylinders`), href: '#/estoque' },
    {
      done: !!meta.householdId,
      title: L('Convidar a família', 'Invite the family'),
      detail: meta.householdId ? L(`Casa: ${meta.householdName}`, `Household: ${meta.householdName}`) : syncAvailable ? L('Crie a casa e passe o código', 'Create the household and share the code') : L('Sincronização desativada neste app', 'Sync is turned off in this app'),
      href: '#/familia',
    },
    { done: isStandalone(), title: L('Instalar na tela inicial', 'Install on the home screen'), detail: isStandalone() ? L('Instalado', 'Installed') : L('Para abrir sem internet', 'To open without internet'), href: '#/ajustes' },
  ];
  const stepsDone = steps.filter((s) => s.done).length;

  return (
    <>
      <div class="topbar">
        <div>
          <h1>KeepReady</h1>
          <div class="sub">{r.settings.householdName}</div>
        </div>
        <SyncPill />
      </div>

      {!r.settings.planConfigured && (
        <Card>
          <div class="small">
            <b>{L('Configure o seu plano.', 'Set up your plan.')}</b> {L('Diga quantas pessoas, quantos dias de autonomia e o perfil de cada uma: o app calcula comida, baldes, água, gás e caixas de 27 galões.', 'Tell the app how many people, how many days of self-reliance and each one’s profile: it calculates food, buckets, water, gas and 27-gallon totes.')}
          </div>
          <div style={{ marginTop: 10 }}>
            <a class="btn primary" href="#/plano">
              {L('Configurar plano', 'Set up plan')}
            </a>
          </div>
        </Card>
      )}

      <Card>
        <div class="row" style={{ gap: 16 }}>
          <Ring value={target > 0 ? r.a.min / target : 0} tone={tone} big={daysFmt(r.a.min)} label={L('dias de autonomia', 'days of self-reliance')} />
          <div class="grow">
            <div class="small muted">{L('Meta', 'Goal')} · {r.members.length} {plural(r.members.length, L('pessoa', 'person'), L('pessoas', 'people'))}</div>
            <div class="mono" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {target} {L('dias', 'days')}
            </div>
            <a class="xs" href="#/plano">{L('Ajustar plano', 'Adjust plan')}</a>
            <div style={{ marginTop: 8 }}>
              <Pill tone={noStock ? 'neutral' : tone}>{noStock ? L('Estoque vazio', 'Stock empty') : L(`Gargalo: ${PILLAR_LABEL[r.a.limiting]}`, `Bottleneck: ${PILLAR_LABEL[r.a.limiting]}`)}</Pill>
            </div>
            <div class="small muted" style={{ marginTop: 8 }}>
              {L('Prontidão', 'Readiness')} <span class="mono">{r.score}%</span>
            </div>
          </div>
        </div>
        {noStock && <p class="small muted" style={{ marginTop: 12, marginBottom: 0 }}>{L('Nada lacrado ainda. Siga os próximos passos abaixo; o painel se atualiza sozinho.', 'Nothing sealed yet. Follow the next steps below; the dashboard updates on its own.')}</p>}
      </Card>

      <Card>
        <div class="grid3">
          <Gauge name={L('Comida', 'Food')} days={r.a.food} target={target} sub={`${n0(r.stock.totalKcal)} kcal`} />
          <Gauge name={L('Água', 'Water')} days={r.a.water} target={target} sub={`${n0(r.sup.waterGal)} gal`} />
          <Gauge name={L('Gás', 'Gas')} days={r.a.gas} target={target} sub={`${r.sup.propaneFull} ${plural(r.sup.propaneFull, L('botijão', 'cylinder'), L('botijões', 'cylinders'))}`} />
        </div>
      </Card>

      <Card>
        <div class="row between">
          <h2 style={{ margin: 0 }}>{L('Calorias', 'Calories')}</h2>
          <a class="small" href="#/familia">{L('Ajustar metas', 'Adjust goals')}</a>
        </div>
        <div class="row wrap" style={{ marginTop: 8, gap: 16 }}>
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{n0(r.kcalPerDay)}</div>
            <div class="xs muted">{L('kcal por dia', 'kcal per day')} · {r.members.length} {plural(r.members.length, L('pessoa', 'person'), L('pessoas', 'people'))}</div>
          </div>
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{n0(r.stock.totalKcal)}</div>
            <div class="xs muted">{L(`kcal no estoque (de ${n0(r.stock.plannedKcal)} planejados)`, `kcal in stock (of ${n0(r.stock.plannedKcal)} planned)`)}</div>
          </div>
        </div>
        <div class="gauge" style={{ marginTop: 10, '--c': 'var(--brand)' } as never}>
          <div class="track">
            <div class="fill" style={{ width: `${r.stock.plannedKcal > 0 ? Math.min(100, (r.stock.totalKcal / r.stock.plannedKcal) * 100) : 0}%` }} />
          </div>
        </div>
        <div class="xs muted" style={{ marginTop: 6 }}>{L(`O plano completo daria ${n1(r.foodPlanDays)} dias de comida.`, `The full plan would give ${n1(r.foodPlanDays)} days of food.`)}</div>
      </Card>

      <Card>
        <div class="row between">
          <h2 style={{ margin: 0 }}>{L('Baldes', 'Buckets')}</h2>
          <a class="small" href="#/estoque">{L('Ver estoque', 'See stock')}</a>
        </div>
        <div class="chips" style={{ marginTop: 10 }}>
          {rows.map((row) => (
            <a key={row.bucket.n} class={`chip ${STATUS_TONE[row.status]}`} href="#/estoque" title={`${tx(row.bucket.name)}: ${STATUS_LABEL[row.status]}`}>
              {row.bucket.n}
            </a>
          ))}
        </div>
        <div class="legend">
          {(['planned', 'ok', 'soon', 'overdue', 'rotating'] as RotStatus[]).map((s) => (
            <span key={s} style={{ '--c': `var(--${STATUS_TONE[s]})` } as never}>
              <i />
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
        <div class="small" style={{ marginTop: 10 }}>
          {rotating ? (
            <>
              <b>{tx(rotating.bucket.name)}</b> {L('em rotação desde ', 'rotating since ')}{fmtDate(rotating.bucket.rotationStartedOn)}{L('. Um por vez: conclua antes de abrir outro.', '. One at a time: finish before opening another.')}
            </>
          ) : next ? (
            <>
              {L('Próxima rotação: ', 'Next rotation: ')}<b>{tx(next.bucket.name)}</b>{L(' em ', ' on ')}{fmtDate(next.dueOn)}
              {next.daysToDue !== undefined && (next.daysToDue < 0 ? L(` (venceu há ${Math.abs(next.daysToDue)} dias)`, ` (${Math.abs(next.daysToDue)} days overdue)`) : L(` (daqui a ${n0(next.daysToDue)} dias)`, ` (in ${n0(next.daysToDue)} days)`))}.
            </>
          ) : (
            <span class="muted">{L('Sem rotação marcada: lacre os baldes para começar o calendário. ', 'No rotation scheduled: seal the buckets to start the calendar. ')}{sealedCount}/{r.buckets.length} {L('lacrados', 'sealed')}.</span>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <a class="small" href="#/rotacao">{L('Plano de rotação', 'Rotation plan')}</a>
        </div>
      </Card>

      {alerts.length > 0 && (
        <Card tone={alerts.some((a) => a.tone === 'bad') ? 'bad' : 'warn'}>
          <h2>{L('Atenção', 'Attention')}</h2>
          <ul class="list">
            {alerts.map((a, i) => (
              <li key={i}>
                <div class="row" style={{ alignItems: 'flex-start' }}>
                  <Pill tone={a.tone}>{a.tone === 'bad' ? L('Urgente', 'Urgent') : L('Aviso', 'Warning')}</Pill>
                  <div class="grow small">{a.href ? <a href={a.href} style={{ color: 'inherit' }}>{a.text}</a> : a.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div class="row between">
          <h2 style={{ margin: 0 }}>{L('Próximos passos', 'Next steps')}</h2>
          <span class="small muted mono">{stepsDone}/{steps.length}</span>
        </div>
        <ul class="list" style={{ marginTop: 6 }}>
          {steps.map((s) => (
            <li key={s.title}>
              <a href={s.href} style={{ color: 'inherit', textDecoration: 'none' }} class="row">
                <span class="mono" style={{ color: s.done ? 'var(--ok)' : 'var(--text3)', fontWeight: 700, width: 18 }}>{s.done ? '✓' : '○'}</span>
                <span class="grow">
                  <div class={s.done ? 'muted' : ''} style={{ fontWeight: 600 }}>{s.title}</div>
                  <div class="xs muted">{s.detail}</div>
                </span>
              </a>
            </li>
          ))}
        </ul>
        {shopLeft > 0 && <div class="xs muted" style={{ marginTop: 6 }}>{L(`Falta comprar cerca de ${usd(shopLeft)} (itens com preço).`, `About ${usd(shopLeft)} left to buy (priced items).`)}</div>}
        {r.cylindersNeed !== r.sup.propaneTarget && (
          <div class="xs muted" style={{ marginTop: 4 }}>
            {L(`Com a altitude de ${n0(r.settings.altitudeFt)} pés e ${r.settings.cookingMode === 'pressure' ? 'panela de pressão' : 'panela aberta'}, o app recomenda ${cylindersNeeded(r.kcalPerDay, r.settings)} botijões (meta atual: ${r.sup.propaneTarget}).`, `At ${n0(r.settings.altitudeFt)} ft altitude with ${r.settings.cookingMode === 'pressure' ? 'a pressure cooker' : 'an open pot'}, the app recommends ${cylindersNeeded(r.kcalPerDay, r.settings)} cylinders (current goal: ${r.sup.propaneTarget}).`)}
          </div>
        )}
      </Card>
    </>
  );
}
