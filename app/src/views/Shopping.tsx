import { useState } from 'preact/hooks';
import { Btn, Card, NumField, Pill, SelectField, TextField } from '../components/ui';
import { saveShop, store } from '../lib/db';
import { useReadiness } from '../lib/derived';
import { n0, usd } from '../lib/fmt';
import { newId } from '../lib/store';
import type { ShopItem } from '../lib/types';

type Item = ShopItem & { id: string };
type Tab = 'Todos' | 'Costco' | 'Outros' | 'Reposição';

function Row({ it }: { it: Item }) {
  const [editing, setEditing] = useState(false);
  const sub = it.unitPrice !== undefined ? it.unitPrice * it.qty : undefined;
  return (
    <li>
      <div class={`item-check ${it.checked ? 'done' : ''}`}>
        <input type="checkbox" checked={it.checked} aria-label={`Comprado: ${it.name}`} onChange={(e) => saveShop(it.id, { checked: (e.currentTarget as HTMLInputElement).checked })} />
        <div class="grow">
          <div class="name" style={{ fontWeight: 600 }}>
            {it.name}
          </div>
          <div class="xs muted mono">
            {n0(it.qty * 100) === n0(Math.round(it.qty) * 100) ? n0(it.qty) : it.qty} {it.unit}
            {it.unitPrice !== undefined ? ` · ${usd(it.unitPrice)} cada` : ' · sem preço'}
            {sub !== undefined ? ` = ${usd(sub)}` : ''}
          </div>
          {it.note && <div class="xs faint">{it.note}</div>}
        </div>
        <Btn small onClick={() => setEditing(!editing)}>
          {editing ? 'Fechar' : 'Editar'}
        </Btn>
      </div>
      {editing && (
        <div class="grid2" style={{ marginTop: 10 }}>
          <NumField label="Quantidade" value={it.qty} min={0} onChange={(v) => saveShop(it.id, { qty: v ?? 0 })} />
          <NumField label="Preço de cada" suffix="US$" value={it.unitPrice} min={0} step={0.01} onChange={(v) => saveShop(it.id, { unitPrice: v })} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Btn small kind="danger" onClick={() => store.remove(it.id)}>
              Remover da lista
            </Btn>
          </div>
        </div>
      )}
    </li>
  );
}

export function Shopping() {
  const r = useReadiness();
  const [tab, setTab] = useState<Tab>('Todos');
  const [name, setName] = useState('');
  const [qty, setQty] = useState<number | undefined>(1);
  const [unit, setUnit] = useState('un.');
  const [where, setWhere] = useState<'Costco' | 'Outros'>('Costco');

  const items = r.shop as Item[];
  const shown = tab === 'Todos' ? items : items.filter((i) => i.store === tab);
  const price = (i: Item) => (i.unitPrice ?? 0) * i.qty;
  const left = items.filter((i) => !i.checked).reduce((s, i) => s + price(i), 0);
  const bought = items.filter((i) => i.checked).reduce((s, i) => s + price(i), 0);
  const noPrice = items.filter((i) => !i.checked && i.unitPrice === undefined).length;
  const done = items.filter((i) => i.checked).length;
  const hasRep = items.some((i) => i.store === 'Reposição');

  const stores: ('Reposição' | 'Costco' | 'Outros')[] = ['Reposição', 'Costco', 'Outros'];
  const groups = stores
    .map((s) => ({ s, items: shown.filter((i) => i.store === s) }))
    .filter((g) => g.items.length > 0);

  const add = () => {
    if (!name.trim()) return;
    const order = items.reduce((m, i) => Math.max(m, i.order), 0) + 1;
    store.put('shop', newId('shop'), { name: name.trim(), qty: qty ?? 1, unit: unit.trim() || 'un.', store: where, section: 'Extras', checked: false, order });
    setName('');
    setQty(1);
  };

  return (
    <>
      <div class="topbar">
        <div>
          <h1>Compras</h1>
          <div class="sub">
            {done} de {items.length} comprados
          </div>
        </div>
      </div>

      <Card>
        <div class="grid2">
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{usd(left)}</div>
            <div class="xs muted">falta comprar{noPrice > 0 ? ` (+ ${noPrice} sem preço)` : ''}</div>
          </div>
          <div>
            <div class="mono" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{usd(bought)}</div>
            <div class="xs muted">já comprado</div>
          </div>
        </div>
        <div class="xs faint" style={{ marginTop: 8 }}>Os preços são estimativas do plano, não leitura de hoje: confira na loja e corrija em Editar.</div>
      </Card>

      <div class="row wrap" style={{ marginBottom: 12 }}>
        {(['Todos', 'Costco', 'Outros', ...(hasRep ? ['Reposição'] : [])] as Tab[]).map((t) => (
          <button key={t} class={`btn small ${tab === t ? 'primary' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {groups.map((g) => (
        <Card key={g.s}>
          <div class="row between">
            <h2 style={{ margin: 0 }}>{g.s === 'Reposição' ? 'Reposição de baldes' : g.s === 'Outros' ? 'Outras lojas' : 'Costco'}</h2>
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

      <details class="card">
        <summary>
          <b>Adicionar item</b>
        </summary>
        <div class="stack">
          <TextField label="Item" value={name} onChange={setName} placeholder="Ex.: pilhas AA" />
          <div class="grid3">
            <NumField label="Qtd" value={qty} min={0} onChange={setQty} />
            <TextField label="Unidade" value={unit} onChange={setUnit} />
            <SelectField label="Onde" value={where} options={[{ value: 'Costco', label: 'Costco' }, { value: 'Outros', label: 'Outros' }]} onChange={setWhere} />
          </div>
          <Btn kind="primary" onClick={add} disabled={!name.trim()}>
            Adicionar
          </Btn>
        </div>
      </details>
    </>
  );
}
