import { useState } from 'preact/hooks';
import { Btn, Card, NumField, Pill, SelectField, TextField } from '../components/ui';
import { CATEGORY_LABEL, CATEGORY_ORDER, SOURCE_LABEL } from '../content/catalog';
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
            preciso {n0(l.need)} {l.unit}
            {l.missing > 0 ? ` · falta ${n0(l.missing)}` : ''}
          </div>
          <div class="row wrap" style={{ marginTop: 4, gap: 6 }}>
            <Pill tone={complete ? 'ok' : l.have > 0 ? 'warn' : 'neutral'}>{complete ? 'Completo' : l.have > 0 ? 'Parcial' : 'Falta'}</Pill>
            {l.outside && <Pill tone="info">Fora da caixa</Pill>}
            {exp === 'bad' && <Pill tone="bad">Vencido</Pill>}
            {exp === 'warn' && <Pill tone="warn">Vence em breve</Pill>}
          </div>
        </div>
        <div style={{ width: 92 }}>
          <NumField label="Tenho" value={l.have} min={0} step={1} onChange={(v) => saveGear(l.id, { have: Math.max(0, v ?? 0) })} />
        </div>
      </div>
      <details style={{ marginTop: 4 }}>
        <summary class="xs muted">Detalhes</summary>
        <div class="stack" style={{ marginTop: 8 }}>
          {l.item && (
            <div class="xs muted">
              <div>
                Quantidade: {l.item.how} ({l.item.qty === 'fonte' ? 'valor citado pela fonte' : 'estimativa do app'}).
              </div>
              <div>Item listado por: {l.item.listedBy.map((s) => SOURCE_LABEL[s]).join(', ')}.</div>
              {l.item.note && <div style={{ marginTop: 4 }}>{l.item.note}</div>}
            </div>
          )}
          {l.custom && <div class="xs muted">Item seu.</div>}
          <TextField label="Validade (do que você tem)" type="date" value={l.expiresOn ?? ''} onChange={(v) => saveGear(l.id, { expiresOn: v || undefined })} />
          <div class="row wrap">
            {l.custom ? (
              <Btn small kind="danger" onClick={() => store.remove(gearRecId(l.id))}>
                Remover item
              </Btn>
            ) : (
              <Btn small onClick={() => saveGear(l.id, { hidden: true })}>
                Desligar este item
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
          <h1>Caixas de {TOTE_GAL} gal</h1>
          <div class="sub">
            {plan.totes.length} {plural(plan.totes.length, 'caixa', 'caixas')} · {prog.done} de {prog.total} itens completos
          </div>
        </div>
      </div>

      <Card>
        <div class="small">
          As caixas guardam o que <b>não é perecível, não precisa de vedação e você vai usar com frequência</b>: higiene, cozinha, remédios, lanternas, pilhas e ferramentas. Comida de longo prazo vai nos baldes de Mylar.
        </div>
        <div class="xs muted" style={{ marginTop: 8 }}>
          A lista abaixo se recalcula com as pessoas, a meta de {r.settings.daysTarget} dias e o perfil de cada um (<a href="#/plano">Plano</a>). Cada caixa leva até {n0(r.settings.toteCapKg)} kg e {Math.round(TOTE_FILL * 100)}% do volume.
        </div>
        <div class="grid2" style={{ marginTop: 10 }}>
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{plan.totes.length}</div>
            <div class="xs muted">{plural(plan.totes.length, 'caixa', 'caixas')} de {TOTE_GAL} gal</div>
          </div>
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{prog.pct}%</div>
            <div class="xs muted">dos itens completos</div>
          </div>
        </div>
        <div class="xs faint" style={{ marginTop: 8 }}>
          Volume e peso por item são aproximações do app ({n0(totals.liters)} L, {n0(totals.kg)} kg no total): confira ao arrumar de verdade.
        </div>
      </Card>

      {expiringSoon.length > 0 && (
        <Card tone="warn">
          <h2>Validade</h2>
          <ul class="list">
            {expiringSoon.map((l) => (
              <li key={l.id} class="small">
                {l.name}: {diffDays(today, l.expiresOn!) < 0 ? `venceu em ${fmtDate(l.expiresOn)}` : `vence em ${fmtDate(l.expiresOn)}`}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <h2>Como arrumar</h2>
      {plan.totes.length === 0 && (
        <Card>
          <div class="small muted">Nenhum item ligado. Adicione pessoas e uma meta no Plano.</div>
        </Card>
      )}
      {plan.totes.map((t) => (
        <details class="card" key={t.n}>
          <summary>
            <div class="row between">
              <div>
                <b>{toteTitle(t)}</b>
                <div class="xs muted mono">
                  {n0(t.liters)} L · {n1(t.kg)} kg · {t.lines.length} {plural(t.lines.length, 'item', 'itens')}
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

      <h2>Lista por categoria</h2>
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
            <b>Não se aplicam à sua casa agora ({na.length})</b>
          </summary>
          <div class="xs muted" style={{ marginTop: 6 }}>
            O perfil das pessoas faz a quantidade ser zero (por exemplo, fraldas sem bebê). Se mudar o perfil, o item volta sozinho.
          </div>
          <ul class="list" style={{ marginTop: 6 }}>
            {na.map((l) => (
              <li key={l.id} class="small">
                {l.name}
                {l.item ? <div class="xs muted">{l.item.how}</div> : null}
              </li>
            ))}
          </ul>
        </details>
      )}

      {hidden.length > 0 && (
        <details class="card">
          <summary>
            <b>Itens desligados ({hidden.length})</b>
          </summary>
          <div class="xs muted" style={{ marginTop: 6 }}>
            Opcionais vêm desligados. Itens desligados não entram na conta das caixas nem na lista de compras.
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
                    Ligar
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      <details class="card">
        <summary>
          <b>Adicionar um item seu</b>
        </summary>
        <div class="stack">
          <TextField label="Item" value={name} onChange={setName} placeholder="Ex.: ração de gato" />
          <div class="grid2">
            <SelectField<GearCategory> label="Categoria" value={cat} options={CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))} onChange={setCat} />
            <TextField label="Unidade" value={unit} onChange={setUnit} />
          </div>
          <div class="grid3">
            <NumField label="Preciso" value={need} min={0} step={1} onChange={setNeed} />
            <NumField label="Volume (L)" value={liters} min={0} onChange={setLiters} />
            <NumField label="Peso (kg)" value={kg} min={0} onChange={setKg} />
          </div>
          <Btn kind="primary" onClick={addCustom} disabled={!name.trim()}>
            Adicionar
          </Btn>
        </div>
      </details>
    </>
  );
}
