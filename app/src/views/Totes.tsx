import { useState } from 'preact/hooks';
import { Btn, Card, NumField, Pill, SelectField, TextField } from '../components/ui';
import { CATEGORY_LABEL, CATEGORY_ORDER, SOURCE_LABEL, catText } from '../content/catalog';
import { L } from '../lib/i18n';
import { diffDays, fmtDate, todayISO } from '../lib/dates';
import { saveGear, store } from '../lib/db';
import { usePlan, useReadiness } from '../lib/derived';
import { n0, n1, plural } from '../lib/fmt';
import { activeLines, gearProgress, gearRecId, gearTotals, toteTitle, TOTE_GAL, TOTE_FILL, type GearLine } from '../lib/planner';
import { newId } from '../lib/store';
import type { GearCategory } from '../lib/types';

function expiryTone(l: GearLine, today: string): 'bad' | 'warn' | undefined {
  if (!l.expiresOn || l.have <= 0) return undefined;
  const d = diffDays(today, l.expiresOn);
  return d < 0 ? 'bad' : d <= 90 ? 'warn' : undefined;
}

function GearRow({ l, today }: { l: GearLine; today: string }) {
  const complete = l.have >= l.need;
  const exp = expiryTone(l, today);
  return (
    <li>
      <div class="row" style={{ alignItems: 'flex-start' }}>
        <div class="grow">
          <div style={{ fontWeight: 600 }}>{l.name}</div>
          <div class="xs muted mono">
            {L('preciso ', 'need ')}{n0(l.need)} {l.unit}
            {l.missing > 0 ? L(` · falta ${n0(l.missing)}`, ` · missing ${n0(l.missing)}`) : ''}
          </div>
          <div class="row wrap" style={{ marginTop: 4, gap: 6 }}>
            <Pill tone={complete ? 'ok' : l.have > 0 ? 'warn' : 'neutral'}>{complete ? L('Completo', 'Complete') : l.have > 0 ? L('Parcial', 'Partial') : L('Falta', 'Missing')}</Pill>
            {l.outside && <Pill tone="info">{L('Fora da caixa', 'Outside the tote')}</Pill>}
            {exp === 'bad' && <Pill tone="bad">{L('Vencido', 'Expired')}</Pill>}
            {exp === 'warn' && <Pill tone="warn">{L('Vence em breve', 'Expires soon')}</Pill>}
          </div>
        </div>
        <div style={{ width: 92 }}>
          <NumField label={L('Tenho', 'I have')} value={l.have} min={0} step={1} onChange={(v) => saveGear(l.id, { have: Math.max(0, v ?? 0) })} />
        </div>
      </div>
      <details style={{ marginTop: 4 }}>
        <summary class="xs muted">{L('Detalhes', 'Details')}</summary>
        <div class="stack" style={{ marginTop: 8 }}>
          {l.item && (
            <div class="xs muted">
              <div>
                {L('Quantidade: ', 'Quantity: ')}{catText(l.item).how} ({l.item.qty === 'fonte' ? L('valor citado pela fonte', 'value cited by the source') : L('estimativa do app', 'app estimate')}).
              </div>
              <div>{L('Item listado por: ', 'Item listed by: ')}{l.item.listedBy.map((s) => SOURCE_LABEL[s]).join(', ')}.</div>
              {l.item.note && <div style={{ marginTop: 4 }}>{catText(l.item).note}</div>}
            </div>
          )}
          {l.custom && <div class="xs muted">{L('Item seu.', 'Your own item.')}</div>}
          <TextField label={L('Validade (do que você tem)', 'Expiry date (of what you have)')} type="date" value={l.expiresOn ?? ''} onChange={(v) => saveGear(l.id, { expiresOn: v || undefined })} />
          <div class="row wrap">
            {l.custom ? (
              <Btn small kind="danger" onClick={() => store.remove(gearRecId(l.id))}>
                {L('Remover item', 'Remove item')}
              </Btn>
            ) : (
              <Btn small onClick={() => saveGear(l.id, { hidden: true })}>
                {L('Desligar este item', 'Turn off this item')}
              </Btn>
            )}
          </div>
        </div>
      </details>
    </li>
  );
}

export function Totes() {
  const r = useReadiness();
  const plan = usePlan();
  const today = todayISO();
  const lines = plan.gearLines;
  const active = activeLines(lines);
  const prog = gearProgress(lines);
  const totals = gearTotals(lines);
  const hidden = lines.filter((l) => l.hidden && !l.na);
  const na = lines.filter((l) => l.na && !l.hidden);
  const expiringSoon = active.filter((l) => l.have > 0 && l.expiresOn && diffDays(today, l.expiresOn) <= 90);

  const [name, setName] = useState('');
  const [cat, setCat] = useState<GearCategory>('ferramentas');
  const [unit, setUnit] = useState('un.');
  const [need, setNeed] = useState<number | undefined>(1);
  const [liters, setLiters] = useState<number | undefined>(1);
  const [kg, setKg] = useState<number | undefined>(0.5);

  const addCustom = () => {
    if (!name.trim()) return;
    const id = newId('c');
    saveGear(id, { have: 0, custom: { name: name.trim(), category: cat, unit: unit.trim() || 'un.', need: Math.max(0, Math.round(need ?? 1)), liters: Math.max(0, liters ?? 0), kg: Math.max(0, kg ?? 0) } });
    setName('');
    setNeed(1);
  };

  const byCat = CATEGORY_ORDER.map((c) => ({ c, items: active.filter((l) => l.category === c) })).filter((g) => g.items.length > 0);

  return (
    <>
      <div class="topbar">
        <div>
          <h1>{L(`Caixas de ${TOTE_GAL} gal`, `${TOTE_GAL}-gal totes`)}</h1>
          <div class="sub">
            {plan.totes.length} {plural(plan.totes.length, L('caixa', 'tote'), L('caixas', 'totes'))} · {prog.done}{L(' de ', ' of ')}{prog.total}{L(' itens completos', ' items complete')}
          </div>
        </div>
      </div>

      <Card>
        <div class="small">
          {L('As caixas guardam o que ', 'The totes hold what is ')}<b>{L('não é perecível, não precisa de vedação e você vai usar com frequência', 'non-perishable, needs no sealing and that you will use often')}</b>{L(': higiene, cozinha, remédios, lanternas, pilhas e ferramentas. Comida de longo prazo vai nos baldes de Mylar.', ': hygiene, kitchen, medication, flashlights, batteries and tools. Long-term food goes in the Mylar buckets.')}
        </div>
        <div class="xs muted" style={{ marginTop: 8 }}>
          {L(`A lista abaixo se recalcula com as pessoas, a meta de ${r.settings.daysTarget} dias e o perfil de cada um (`, `The list below recalculates with the people, the ${r.settings.daysTarget}-day goal and each person's profile (`)}<a href="#/plano">{L('Plano', 'Plan')}</a>{L(`). Cada caixa leva até ${n0(r.settings.toteCapKg)} kg e ${Math.round(TOTE_FILL * 100)}% do volume.`, `). Each tote holds up to ${n0(r.settings.toteCapKg)} kg and ${Math.round(TOTE_FILL * 100)}% of its volume.`)}
        </div>
        <div class="grid2" style={{ marginTop: 10 }}>
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{plan.totes.length}</div>
            <div class="xs muted">{plural(plan.totes.length, L('caixa', 'tote'), L('caixas', 'totes'))}{L(' de ', ' of ')}{TOTE_GAL} gal</div>
          </div>
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{prog.pct}%</div>
            <div class="xs muted">{L('dos itens completos', 'of items complete')}</div>
          </div>
        </div>
        <div class="xs faint" style={{ marginTop: 8 }}>
          {L(`Volume e peso por item são aproximações do app (${n0(totals.liters)} L, ${n0(totals.kg)} kg no total): confira ao arrumar de verdade.`, `Volume and weight per item are app approximations (${n0(totals.liters)} L, ${n0(totals.kg)} kg in total): check when you actually pack.`)}
        </div>
      </Card>

      {expiringSoon.length > 0 && (
        <Card tone="warn">
          <h2>{L('Validade', 'Expiry')}</h2>
          <ul class="list">
            {expiringSoon.map((l) => (
              <li key={l.id} class="small">
                {l.name}: {diffDays(today, l.expiresOn!) < 0 ? L(`venceu em ${fmtDate(l.expiresOn)}`, `expired on ${fmtDate(l.expiresOn)}`) : L(`vence em ${fmtDate(l.expiresOn)}`, `expires on ${fmtDate(l.expiresOn)}`)}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <h2>{L('Como arrumar', 'How to pack')}</h2>
      {plan.totes.length === 0 && (
        <Card>
          <div class="small muted">{L('Nenhum item ligado. Adicione pessoas e uma meta no Plano.', 'No items turned on. Add people and a goal in the Plan.')}</div>
        </Card>
      )}
      {plan.totes.map((t) => (
        <details class="card" key={t.n}>
          <summary>
            <div class="row between">
              <div>
                <b>{toteTitle(t)}</b>
                <div class="xs muted mono">
                  {n0(t.liters)} L · {n1(t.kg)} kg · {t.lines.length} {plural(t.lines.length, 'item', L('itens', 'items'))}
                </div>
              </div>
            </div>
          </summary>
          <ul class="list" style={{ marginTop: 6 }}>
            {t.lines.map((l, i) => (
              <li key={`${l.id}-${i}`} class="small">
                <span class="mono">{n0(l.qty)}</span> {l.unit} · {l.name}
              </li>
            ))}
          </ul>
        </details>
      ))}

      <h2>{L('Lista por categoria', 'List by category')}</h2>
      {byCat.map((g) => (
        <Card key={g.c}>
          <div class="row between">
            <h2 style={{ margin: 0 }}>{CATEGORY_LABEL[g.c]}</h2>
            <Pill tone={g.items.every((l) => l.have >= l.need) ? 'ok' : 'neutral'}>
              {g.items.filter((l) => l.have >= l.need).length}/{g.items.length}
            </Pill>
          </div>
          <ul class="list" style={{ marginTop: 6 }}>
            {g.items.map((l) => (
              <GearRow key={l.id} l={l} today={today} />
            ))}
          </ul>
        </Card>
      ))}

      {na.length > 0 && (
        <details class="card">
          <summary>
            <b>{L(`Não se aplicam à sua casa agora (${na.length})`, `Do not apply to your household right now (${na.length})`)}</b>
          </summary>
          <div class="xs muted" style={{ marginTop: 6 }}>
            {L('O perfil das pessoas faz a quantidade ser zero (por exemplo, fraldas sem bebê). Se mudar o perfil, o item volta sozinho.', 'The people’s profiles make the quantity zero (for example, diapers with no baby). If you change the profile, the item comes back on its own.')}
          </div>
          <ul class="list" style={{ marginTop: 6 }}>
            {na.map((l) => (
              <li key={l.id} class="small">
                {l.name}
                {l.item ? <div class="xs muted">{catText(l.item).how}</div> : null}
              </li>
            ))}
          </ul>
        </details>
      )}

      {hidden.length > 0 && (
        <details class="card">
          <summary>
            <b>{L(`Itens desligados (${hidden.length})`, `Turned-off items (${hidden.length})`)}</b>
          </summary>
          <div class="xs muted" style={{ marginTop: 6 }}>
            {L('Opcionais vêm desligados. Itens desligados não entram na conta das caixas nem na lista de compras.', 'Optional items start turned off. Turned-off items are not counted in the totes or the shopping list.')}
          </div>
          <ul class="list" style={{ marginTop: 6 }}>
            {hidden.map((l) => (
              <li key={l.id}>
                <div class="row between">
                  <div class="grow small">
                    {l.name}
                    <div class="xs muted mono">
                      {n0(l.need)} {l.unit}
                    </div>
                  </div>
                  <Btn small onClick={() => saveGear(l.id, { hidden: false })}>
                    {L('Ligar', 'Turn on')}
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      <details class="card">
        <summary>
          <b>{L('Adicionar um item seu', 'Add your own item')}</b>
        </summary>
        <div class="stack">
          <TextField label={L('Item', 'Item')} value={name} onChange={setName} placeholder={L('Ex.: ração de gato', 'E.g. cat food')} />
          <div class="grid2">
            <SelectField<GearCategory> label={L('Categoria', 'Category')} value={cat} options={CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))} onChange={setCat} />
            <TextField label={L('Unidade', 'Unit')} value={unit} onChange={setUnit} />
          </div>
          <div class="grid3">
            <NumField label={L('Preciso', 'I need')} value={need} min={0} step={1} onChange={setNeed} />
            <NumField label={L('Volume (L)', 'Volume (L)')} value={liters} min={0} onChange={setLiters} />
            <NumField label={L('Peso (kg)', 'Weight (kg)')} value={kg} min={0} onChange={setKg} />
          </div>
          <Btn kind="primary" onClick={addCustom} disabled={!name.trim()}>
            {L('Adicionar', 'Add')}
          </Btn>
        </div>
      </details>
    </>
  );
}
