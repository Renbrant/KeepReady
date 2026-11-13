import { useState } from 'preact/hooks';
import { Btn, Card, NumField, Pill, SelectField, TextField } from '../components/ui';
import { saveGear, savePantry, saveShop, saveSupplies, store } from '../lib/db';
import { GEAR_UNIT_PRICE, PANTRY_HINTS, PANTRY_UNIT_PRICE, shopKey } from '../lib/apply';
import { CATEGORY_LABEL } from '../content/catalog';
import { L, tx } from '../lib/i18n';
import { affiliateDisclosure, BUY_LINKS } from '../content/buy';
import { usePlan, useReadiness } from '../lib/derived';
import { activeLines } from '../lib/planner';
import { n0, n1, usd } from '../lib/fmt';
import { newId } from '../lib/store';
import type { ShopItem } from '../lib/types';

type Item = ShopItem & { id: string };
type Tab = 'Todos' | 'Costco' | 'Outros' | 'Reposição';

function Row({ it }: { it: Item }) {
  const [editing, setEditing] = useState(false);
  const sub = it.unitPrice !== undefined ? it.unitPrice * it.qty : undefined;
  const key = shopKey(it);
  const link = key ? BUY_LINKS[key] : undefined;
  return (
    <li>
      <div class={`item-check ${it.checked ? 'done' : ''}`}>
        <input type="checkbox" checked={it.checked} aria-label={L(`Comprado: ${tx(it.name)}`, `Bought: ${tx(it.name)}`)} onChange={(e) => saveShop(it.id, { checked: (e.currentTarget as HTMLInputElement).checked })} />
        <div class="grow">
          <div class="name" style={{ fontWeight: 600 }}>
            {tx(it.name)}
          </div>
          <div class="xs muted mono">
            {n0(it.qty * 100) === n0(Math.round(it.qty) * 100) ? n0(it.qty) : it.qty} {tx(it.unit)}
            {it.unitPrice !== undefined ? L(` · ${usd(it.unitPrice)} cada`, ` · ${usd(it.unitPrice)} each`) : L(' · sem preço', ' · no price')}
            {sub !== undefined ? ` = ${usd(sub)}` : ''}
          </div>
          {it.note && <div class="xs faint">{tx(it.note)}</div>}
          {link && (
            <div style={{ marginTop: 6 }}>
              <a class="btn small" href={link.url} target="_blank" rel="sponsored noopener noreferrer" title={link.title}>
                {link.label}
              </a>
              <div class="xs faint">{link.title}</div>
            </div>
          )}
        </div>
        <Btn small onClick={() => setEditing(!editing)}>
          {editing ? L('Fechar', 'Close') : L('Editar', 'Edit')}
        </Btn>
      </div>
      {editing && (
        <div class="grid2" style={{ marginTop: 10 }}>
          <NumField label={L('Quantidade', 'Quantity')} value={it.qty} min={0} onChange={(v) => saveShop(it.id, { qty: v ?? 0 })} />
          <NumField label={L('Preço de cada', 'Price each')} suffix="US$" value={it.unitPrice} min={0} step={0.01} onChange={(v) => saveShop(it.id, { unitPrice: v })} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Btn small kind="danger" onClick={() => store.remove(it.id)}>
              {L('Remover da lista', 'Remove from list')}
            </Btn>
          </div>
        </div>
      )}
    </li>
  );
}

export function Shopping() {
  const r = useReadiness();
  const plan = usePlan();
  const [tab, setTab] = useState<Tab>('Todos');
  const [name, setName] = useState('');
  const [qty, setQty] = useState<number | undefined>(1);
  const [unit, setUnit] = useState(L('un.', 'ea.'));
  const [where, setWhere] = useState<'Costco' | 'Outros'>('Costco');

  const items = r.shop as Item[];
  const shown = tab === 'Todos' ? items : items.filter((i) => i.store === tab);
  const price = (i: Item) => (i.unitPrice ?? 0) * i.qty;
  const left = items.filter((i) => !i.checked).reduce((s, i) => s + price(i), 0);
  const bought = items.filter((i) => i.checked).reduce((s, i) => s + price(i), 0);
  const noPrice = items.filter((i) => !i.checked && i.unitPrice === undefined).length;
  const done = items.filter((i) => i.checked).length;
  const hasRep = items.some((i) => i.store === 'Reposição');

  const pantryMissing = r.pantry.filter((p) => p.planQty - p.haveQty > 1e-9);
  const waterMissing = Math.max(0, r.sup.waterTargetGal - r.sup.waterGal);
  const gasMissing = Math.max(0, r.sup.propaneTarget - r.sup.propaneFull);
  const gearMissing = activeLines(plan.gearLines).filter((l) => l.missing > 0);

  const pantryEst = pantryMissing.reduce((sum, p) => sum + (PANTRY_UNIT_PRICE[p.name] ?? 0) * (p.planQty - p.haveQty), 0);
  const gearEst = gearMissing.reduce((sum, l) => sum + (GEAR_UNIT_PRICE[l.id] ?? 0) * l.missing, 0);
  const planEst = pantryEst + gearEst;
  const planNoPrice = pantryMissing.filter((p) => PANTRY_UNIT_PRICE[p.name] === undefined).length + gearMissing.filter((l) => GEAR_UNIT_PRICE[l.id] === undefined).length;

  const stores: ('Reposição' | 'Costco' | 'Outros')[] = ['Reposição', 'Costco', 'Outros'];
  const groups = stores
    .map((s) => ({ s, items: shown.filter((i) => i.store === s) }))
    .filter((g) => g.items.length > 0);

  const add = () => {
    if (!name.trim()) return;
    const order = items.reduce((m, i) => Math.max(m, i.order), 0) + 1;
    store.put('shop', newId('shop'), { name: name.trim(), qty: qty ?? 1, unit: unit.trim() || L('un.', 'ea.'), store: where, section: 'Extras', checked: false, order });
    setName('');
    setQty(1);
  };

  return (
    <>
      <div class="topbar">
        <div>
          <h1>{L('Compras', 'Shopping')}</h1>
          <div class="sub">
            {done}{L(' de ', ' of ')}{items.length}{L(' comprados', ' bought')}
          </div>
        </div>
      </div>

      <Card>
        <div class="grid2">
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{usd(left)}</div>
            <div class="xs muted">{L('falta comprar', 'left to buy')}{noPrice > 0 ? L(` (+ ${noPrice} sem preço)`, ` (+ ${noPrice} with no price)`) : ''}</div>
          </div>
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{usd(bought)}</div>
            <div class="xs muted">{L('já comprado', 'already bought')}</div>
          </div>
        </div>
        <div class="small" style={{ marginTop: 10 }}>
          {L('Despensa e caixas, calculadas pelo plano: ', 'Pantry and totes, calculated by the plan: ')}<b>{L('cerca de ', 'about ')}{usd(planEst)}</b>{L(` nos itens com preço estimado (${planNoPrice} itens sem preço, como lanternas, remédios, água e gás). Total estimado: `, ` on items with an estimated price (${planNoPrice} items with no price, such as flashlights, medication, water and gas). Estimated total: `)}<b>{usd(left + planEst)}</b>.
        </div>
        {items.some((i) => { const k = shopKey(i); return !!k && !!BUY_LINKS[k]; }) && <div class="xs faint" style={{ marginTop: 8 }}>{affiliateDisclosure()}</div>}
        <div class="xs faint" style={{ marginTop: 8 }}>{L('Os preços são estimativas do plano, não leitura de hoje: confira na loja e corrija em Editar.', 'Prices are plan estimates, not today’s readings: check in the store and correct them under Edit.')}</div>
      </Card>

      <div class="row wrap" style={{ marginBottom: 12 }}>
        {(['Todos', 'Costco', 'Outros', ...(hasRep ? ['Reposição'] : [])] as Tab[]).map((t) => (
          <button key={t} class={`btn small ${tab === t ? 'primary' : ''}`} onClick={() => setTab(t)}>
            {t === 'Todos' ? L('Todos', 'All') : t === 'Outros' ? L('Outros', 'Other') : t === 'Reposição' ? L('Reposição', 'Replacement') : t}
          </button>
        ))}
      </div>

      {groups.map((g) => (
        <Card key={g.s}>
          <div class="row between">
            <h2 style={{ margin: 0 }}>{g.s === 'Reposição' ? L('Reposição de baldes', 'Bucket replacement') : g.s === 'Outros' ? L('Outras lojas', 'Other stores') : 'Costco'}</h2>
            <Pill tone={g.items.every((i) => i.checked) ? 'ok' : 'neutral'}>
              {g.items.filter((i) => i.checked).length}/{g.items.length}
            </Pill>
          </div>
          <ul class="list" style={{ marginTop: 6 }}>
            {g.items.map((i) => (
              <Row key={i.id} it={i} />
            ))}
          </ul>
        </Card>
      ))}


      {tab === 'Todos' && (
        <>
          <h2>{L('Calculado pelo plano', 'Calculated by the plan')}</h2>
          <div class="xs muted" style={{ marginBottom: 8 }}>
            {L('Estas listas saem do que o plano pede menos o que você já tem. Não entram nos totais em US$ e se atualizam sozinhas. Toque em "Comprei" para dar como completo.', 'These lists are what the plan asks for minus what you already have. They are not included in the US$ totals and update on their own. Tap "Bought" to mark one as complete.')}
          </div>
          {pantryMissing.length > 0 && (
            <Card>
              <div class="row between">
                <h2 style={{ margin: 0 }}>{L('Despensa', 'Pantry')}</h2>
                <Pill tone="neutral">{pantryMissing.length} {L('itens', 'items')}</Pill>
              </div>
              <ul class="list" style={{ marginTop: 6 }}>
                {pantryMissing.map((p) => (
                  <li key={p.id}>
                    <div class="row between" style={{ alignItems: 'flex-start' }}>
                      <div class="grow">
                        <div style={{ fontWeight: 600 }}>{tx(p.name)}</div>
                        <div class="xs muted mono">
                          {L('falta ', 'missing ')}{n1(p.planQty - p.haveQty)} {tx(p.unit)} ({L('plano ', 'plan ')}{n1(p.planQty)}{L(', tenho ', ', have ')}{n1(p.haveQty)})
                          {PANTRY_UNIT_PRICE[p.name] !== undefined ? ` · ≈ ${usd(PANTRY_UNIT_PRICE[p.name] * (p.planQty - p.haveQty))}` : L(' · sem preço', ' · no price')}
                        </div>
                        {PANTRY_HINTS[p.name] && <div class="xs faint">{tx(PANTRY_HINTS[p.name])}</div>}
                      </div>
                      <Btn small onClick={() => savePantry(p.id, { haveQty: p.planQty })}>
                        {L('Comprei', 'Bought')}
                      </Btn>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {(waterMissing > 0 || gasMissing > 0) && (
            <Card>
              <h2>{L('Água e gás', 'Water and gas')}</h2>
              <ul class="list" style={{ marginTop: 6 }}>
                {waterMissing > 0 && (
                  <li>
                    <div class="row between">
                      <div class="grow">
                        <div style={{ fontWeight: 600 }}>{L('Água', 'Water')}</div>
                        <div class="xs muted mono">{L(`falta ${n0(waterMissing)} gal (meta ${n0(r.sup.waterTargetGal)}, tenho ${n0(r.sup.waterGal)} potável)`, `missing ${n0(waterMissing)} gal (goal ${n0(r.sup.waterTargetGal)}, have ${n0(r.sup.waterGal)} drinking)`)}</div>
                      </div>
                      {r.water.hasLots ? (
                        <a class="btn small" href="#/agua">{L('Adicionar lote', 'Add batch')}</a>
                      ) : (
                      <Btn small onClick={() => saveSupplies({ waterGal: r.sup.waterTargetGal })}>
                        {L('Completei', 'Completed')}
                      </Btn>
                      )}
                    </div>
                  </li>
                )}
                {gasMissing > 0 && (
                  <li>
                    <div class="row between">
                      <div class="grow">
                        <div style={{ fontWeight: 600 }}>{L('Botijões de propano 20 lb cheios', 'Full 20 lb propane cylinders')}</div>
                        <div class="xs muted mono">{L(`falta ${gasMissing} (meta ${r.sup.propaneTarget}, tenho ${r.sup.propaneFull})`, `missing ${gasMissing} (goal ${r.sup.propaneTarget}, have ${r.sup.propaneFull})`)}</div>
                        <div class="xs faint">{L('O Costco enche, mas não troca. Confirme se a sua unidade enche.', 'Costco refills but does not exchange. Check that your location refills.')}</div>
                      </div>
                      <Btn small onClick={() => saveSupplies({ propaneFull: r.sup.propaneTarget })}>
                        {L('Completei', 'Completed')}
                      </Btn>
                    </div>
                  </li>
                )}
              </ul>
            </Card>
          )}
          {gearMissing.length > 0 && (
            <Card>
              <div class="row between">
                <h2 style={{ margin: 0 }}>{L('Caixas de 27 gal', '27-gal totes')}</h2>
                <Pill tone="neutral">{gearMissing.length} {L('itens', 'items')}</Pill>
              </div>
              <ul class="list" style={{ marginTop: 6 }}>
                {gearMissing.map((l) => (
                  <li key={l.id}>
                    <div class="row between" style={{ alignItems: 'flex-start' }}>
                      <div class="grow">
                        <div style={{ fontWeight: 600 }}>{l.name}</div>
                        <div class="xs muted mono">
                          {L('falta ', 'missing ')}{n0(l.missing)} {l.unit} · {CATEGORY_LABEL[l.category]}
                        </div>
                      </div>
                      <Btn small onClick={() => saveGear(l.id, { have: l.need })}>
                        {L('Comprei', 'Bought')}
                      </Btn>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {pantryMissing.length === 0 && waterMissing === 0 && gasMissing === 0 && gearMissing.length === 0 && (
            <Card>
              <div class="small muted">{L('Nada pendente na despensa, na água, no gás nem nas caixas.', 'Nothing pending in the pantry, water, gas or totes.')}</div>
            </Card>
          )}
        </>
      )}

      <details class="card">
        <summary>
          <b>{L('Adicionar item', 'Add item')}</b>
        </summary>
        <div class="stack">
          <TextField label={L('Item', 'Item')} value={name} onChange={setName} placeholder={L('Ex.: pilhas AA', 'E.g. AA batteries')} />
          <div class="grid3">
            <NumField label={L('Qtd', 'Qty')} value={qty} min={0} onChange={setQty} />
            <TextField label={L('Unidade', 'Unit')} value={unit} onChange={setUnit} />
            <SelectField label={L('Onde', 'Where')} value={where} options={[{ value: 'Costco', label: 'Costco' }, { value: 'Outros', label: 'Outros' }]} onChange={setWhere} />
          </div>
          <Btn kind="primary" onClick={add} disabled={!name.trim()}>
            {L('Adicionar', 'Add')}
          </Btn>
        </div>
      </details>
    </>
  );
}
