import { SyncPill, agoLabel } from '../components/SyncPill';
import { Card, Gauge, Pill, Ring, toneFor, type Tone } from '../components/ui';
import { cylindersNeeded, expiringSoon, lotExpiry, nextDue, rotationRows, type RotStatus } from '../lib/calc';
import { addDays, diffDays, fmtDate, todayISO } from '../lib/dates';
import { usePlan, useReadiness } from '../lib/derived';
import { activeLines, gearProgress } from '../lib/planner';
import { daysFmt, isStandalone, n0, n1, plural, usd } from '../lib/fmt';
import { useMeta } from '../lib/meta';
import { syncAvailable } from '../lib/supabase';

const STATUS_TONE: Record<RotStatus, Tone> = { planned: 'neutral', ok: 'ok', soon: 'warn', overdue: 'bad', rotating: 'info' };
const STATUS_LABEL: Record<RotStatus, string> = { planned: 'Planejado', ok: 'Lacrado', soon: 'Vence em breve', overdue: 'Vencido', rotating: 'Em rotação' };
const PILLAR_LABEL = { food: 'Comida', water: 'Água', gas: 'Gás' } as const;

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
    if (row.status === 'overdue') alerts.push({ tone: 'bad', text: `${row.bucket.name} passou do prazo de rotação há ${Math.abs(row.daysToDue ?? 0)} dias.`, href: '#/rotacao' });
    if (row.status === 'soon') alerts.push({ tone: 'warn', text: `${row.bucket.name}: rotação em ${row.daysToDue} dias (${fmtDate(row.dueOn)}).`, href: '#/rotacao' });
    if (row.status === 'rotating' && row.bucket.rotationStartedOn) {
      const deadline = addDays(row.bucket.rotationStartedOn, r.settings.rotationWindowDays);
      if (deadline < today) alerts.push({ tone: 'warn', text: `${row.bucket.name} está aberto desde ${fmtDate(row.bucket.rotationStartedOn)}. Conclua a reposição.`, href: '#/rotacao' });
    }
  }
  for (const p of expiringSoon(r.pantry, today)) {
    const d = diffDays(today, p.expiresOn!);
    alerts.push({ tone: d < 0 ? 'bad' : 'warn', text: d < 0 ? `${p.name} venceu em ${fmtDate(p.expiresOn)}.` : `${p.name} vence em ${d} dias.`, href: '#/estoque' });
  }
  for (const g of activeLines(plan.gearLines)) {
    if (g.have <= 0 || !g.expiresOn) continue;
    const d = diffDays(today, g.expiresOn);
    if (d <= 90) alerts.push({ tone: d < 0 ? 'bad' : 'warn', text: d < 0 ? `${g.name} (caixas) venceu em ${fmtDate(g.expiresOn)}.` : `${g.name} (caixas) vence em ${d} dias.`, href: '#/caixas' });
  }
  for (const l of r.waterLots) {
    const exp = lotExpiry(l);
    if (!exp) continue;
    const d = diffDays(today, exp);
    if (d <= 30) alerts.push({ tone: d < 0 ? 'bad' : 'warn', text: d < 0 ? `Água "${l.name}" venceu em ${fmtDate(exp)}.` : `Água "${l.name}" vence em ${d} dias.`, href: '#/agua' });
  }
  if (!noStock && r.a.min < target) {
    alerts.push({ tone: r.a.min < target / 2 ? 'bad' : 'warn', text: `${PILLAR_LABEL[r.a.limiting]} cobre só ${daysFmt(r.a.min)} dos ${target} dias da meta.`, href: '#/estoque' });
  }
  if (meta.persisted === false && !isStandalone()) {
    alerts.push({ tone: 'warn', text: 'O navegador pode apagar os dados do app. Instale na tela inicial e exporte um backup.', href: '#/ajustes' });
  }
  if (meta.householdId && meta.lastSyncAt && Date.now() - Date.parse(meta.lastSyncAt) > 3 * 86400000) {
    alerts.push({ tone: 'warn', text: `Sem sincronizar ${agoLabel(meta.lastSyncAt)}. Abra o app com internet.`, href: '#/familia' });
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
    { done: r.settings.planConfigured, title: 'Planejar: pessoas, dias e perfil', detail: r.settings.planConfigured ? `${r.members.length} ${plural(r.members.length, 'pessoa', 'pessoas')} · ${target} dias de meta` : 'Comece aqui: o app calcula comida, baldes, água, gás e caixas', href: '#/plano' },
    { done: shopTotal > 0 && shopDone === shopTotal, title: 'Comprar os itens', detail: `${shopDone} de ${shopTotal} comprados`, href: '#/compras' },
    { done: inRotationOrSealed === r.buckets.length, title: 'Reembalar e lacrar os baldes', detail: `${inRotationOrSealed} de ${r.buckets.length} lacrados`, href: '#/estoque' },
    { done: pantryDone === r.pantry.length, title: 'Montar a despensa', detail: `${pantryDone} de ${r.pantry.length} itens completos`, href: '#/estoque' },
    { done: gear.total > 0 && gear.done === gear.total, title: 'Montar as caixas de 27 gal', detail: `${gear.done} de ${gear.total} itens completos · ${plan.totes.length} ${plan.totes.length === 1 ? 'caixa' : 'caixas'}`, href: '#/caixas' },
    { done: waterOk && gasOk, title: 'Água e gás', detail: `${n0(r.sup.waterGal)} de ${n0(r.sup.waterTargetGal)} gal · ${r.sup.propaneFull} de ${r.sup.propaneTarget} botijões`, href: '#/estoque' },
    {
      done: !!meta.householdId,
      title: 'Convidar a família',
      detail: meta.householdId ? `Casa: ${meta.householdName}` : syncAvailable ? 'Crie a casa e passe o código' : 'Sincronização desativada neste app',
      href: '#/familia',
    },
    { done: isStandalone(), title: 'Instalar na tela inicial', detail: isStandalone() ? 'Instalado' : 'Para abrir sem internet', href: '#/ajustes' },
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
            <b>Configure o seu plano.</b> Diga quantas pessoas, quantos dias de autonomia e o perfil de cada uma: o app calcula comida, baldes, água, gás e caixas de 27 galões.
          </div>
          <div style={{ marginTop: 10 }}>
            <a class="btn primary" href="#/plano">
              Configurar plano
            </a>
          </div>
        </Card>
      )}

      <Card>
        <div class="row" style={{ gap: 16 }}>
          <Ring value={target > 0 ? r.a.min / target : 0} tone={tone} big={daysFmt(r.a.min)} label="dias de autonomia" />
          <div class="grow">
            <div class="small muted">Meta · {r.members.length} {plural(r.members.length, 'pessoa', 'pessoas')}</div>
            <div class="mono" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {target} dias
            </div>
            <a class="xs" href="#/plano">Ajustar plano</a>
            <div style={{ marginTop: 8 }}>
              <Pill tone={noStock ? 'neutral' : tone}>{noStock ? 'Estoque vazio' : `Gargalo: ${PILLAR_LABEL[r.a.limiting]}`}</Pill>
            </div>
            <div class="small muted" style={{ marginTop: 8 }}>
              Prontidão <span class="mono">{r.score}%</span>
            </div>
          </div>
        </div>
        {noStock && <p class="small muted" style={{ marginTop: 12, marginBottom: 0 }}>Nada lacrado ainda. Siga os próximos passos abaixo; o painel se atualiza sozinho.</p>}
      </Card>

      <Card>
        <div class="grid3">
          <Gauge name="Comida" days={r.a.food} target={target} sub={`${n0(r.stock.totalKcal)} kcal`} />
          <Gauge name="Água" days={r.a.water} target={target} sub={`${n0(r.sup.waterGal)} gal`} />
          <Gauge name="Gás" days={r.a.gas} target={target} sub={`${r.sup.propaneFull} ${plural(r.sup.propaneFull, 'botijão', 'botijões')}`} />
        </div>
      </Card>

      <Card>
        <div class="row between">
          <h2 style={{ margin: 0 }}>Calorias</h2>
          <a class="small" href="#/familia">Ajustar metas</a>
        </div>
        <div class="row wrap" style={{ marginTop: 8, gap: 16 }}>
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{n0(r.kcalPerDay)}</div>
            <div class="xs muted">kcal por dia · {r.members.length} {plural(r.members.length, 'pessoa', 'pessoas')}</div>
          </div>
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{n0(r.stock.totalKcal)}</div>
            <div class="xs muted">kcal no estoque (de {n0(r.stock.plannedKcal)} planejados)</div>
          </div>
        </div>
        <div class="gauge" style={{ marginTop: 10, '--c': 'var(--brand)' } as never}>
          <div class="track">
            <div class="fill" style={{ width: `${r.stock.plannedKcal > 0 ? Math.min(100, (r.stock.totalKcal / r.stock.plannedKcal) * 100) : 0}%` }} />
          </div>
        </div>
        <div class="xs muted" style={{ marginTop: 6 }}>O plano completo daria {n1(r.foodPlanDays)} dias de comida.</div>
      </Card>

      <Card>
        <div class="row between">
          <h2 style={{ margin: 0 }}>Baldes</h2>
          <a class="small" href="#/estoque">Ver estoque</a>
        </div>
        <div class="chips" style={{ marginTop: 10 }}>
          {rows.map((row) => (
            <a key={row.bucket.n} class={`chip ${STATUS_TONE[row.status]}`} href="#/estoque" title={`${row.bucket.name}: ${STATUS_LABEL[row.status]}`}>
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
              <b>{rotating.bucket.name}</b> em rotação desde {fmtDate(rotating.bucket.rotationStartedOn)}. Um por vez: conclua antes de abrir outro.
            </>
          ) : next ? (
            <>
              Próxima rotação: <b>{next.bucket.name}</b> em {fmtDate(next.dueOn)}
              {next.daysToDue !== undefined && (next.daysToDue < 0 ? ` (venceu há ${Math.abs(next.daysToDue)} dias)` : ` (daqui a ${n0(next.daysToDue)} dias)`)}.
            </>
          ) : (
            <span class="muted">Sem rotação marcada: lacre os baldes para começar o calendário. {sealedCount}/{r.buckets.length} lacrados.</span>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <a class="small" href="#/rotacao">Plano de rotação</a>
        </div>
      </Card>

      {alerts.length > 0 && (
        <Card tone={alerts.some((a) => a.tone === 'bad') ? 'bad' : 'warn'}>
          <h2>Atenção</h2>
          <ul class="list">
            {alerts.map((a, i) => (
              <li key={i}>
                <div class="row" style={{ alignItems: 'flex-start' }}>
                  <Pill tone={a.tone}>{a.tone === 'bad' ? 'Urgente' : 'Aviso'}</Pill>
                  <div class="grow small">{a.href ? <a href={a.href} style={{ color: 'inherit' }}>{a.text}</a> : a.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div class="row between">
          <h2 style={{ margin: 0 }}>Próximos passos</h2>
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
        {shopLeft > 0 && <div class="xs muted" style={{ marginTop: 6 }}>Falta comprar cerca de {usd(shopLeft)} (itens com preço).</div>}
        {r.cylindersNeed !== r.sup.propaneTarget && (
          <div class="xs muted" style={{ marginTop: 4 }}>
            Com a altitude de {n0(r.settings.altitudeFt)} pés e {r.settings.cookingMode === 'pressure' ? 'panela de pressão' : 'panela aberta'}, o app recomenda {cylindersNeeded(r.kcalPerDay, r.settings)} botijões (meta atual: {r.sup.propaneTarget}).
          </div>
        )}
      </Card>
    </>
  );
}
