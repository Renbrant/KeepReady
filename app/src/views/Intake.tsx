import { useState } from 'preact/hooks';
import { Scanner } from '../components/Scanner';
import { Btn, Card, Check, NumField, Pill, SelectField, TextField } from '../components/ui';
import { STORAGE_KEYS, norm, storageLabel, storageTip, suggestStorage } from '../content/storage';
import { findKnownByBarcode, lookupBarcode } from '../lib/barcode';
import { fmtDate, todayISO } from '../lib/dates';
import { saveLot, savePantry, store, useLots, usePantry, useShop } from '../lib/db';
import { n1 } from '../lib/fmt';
import { L, tx } from '../lib/i18n';
import { childLabel, consumeLot, labelText, lotStatus, matchPantry, nextLabelBase, partLabel, splitLot, splitQuantities } from '../lib/lots';
import { newId } from '../lib/store';
import type { StockLot, StorageKey } from '../lib/types';

/* ====================================================================
 * Entrada de compras: o que você comprou de verdade, com validade e etiqueta.
 * Só entra o que faz parte do estoque de emergência. O resto não é salvo nem controlado.
 * ==================================================================== */

interface Draft {
  key: string;
  name: string;
  qty: number | undefined;
  unit: string;
  expiresOn: string;
  inStock: boolean;
  storage: StorageKey;
  storageTouched: boolean;
  place: string;
  barcode?: string;
  parts: number | undefined;
  pantryId?: string;
  shopId?: string;
  hint?: string;
}

let draftSeq = 0;
const blank = (over: Partial<Draft> = {}): Draft => ({
  key: `d${++draftSeq}`,
  name: '',
  qty: 1,
  unit: L('un.', 'ea.'),
  expiresOn: '',
  inStock: true,
  storage: 'other',
  storageTouched: false,
  place: '',
  parts: 1,
  ...over,
});

function storageOptions(): { value: StorageKey; label: string }[] {
  return STORAGE_KEYS.map((k) => ({ value: k, label: storageLabel(k) }));
}

export function Intake() {
  const lots = useLots();
  const pantry = usePantry();
  const shop = useShop();
  const today = todayISO();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [scanFor, setScanFor] = useState<string | 'new' | null>(null);
  const [busy, setBusy] = useState('');
  const [saved, setSaved] = useState<{ lines: string[]; skipped: number } | null>(null);
  const [filter, setFilter] = useState('');

  const upd = (key: string, patch: Partial<Draft>) => setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  const addDraft = (over: Partial<Draft> = {}) => {
    setSaved(null);
    setDrafts((ds) => [...ds, blank(over)]);
  };

  const setName = (d: Draft, name: string) => {
    const patch: Partial<Draft> = { name };
    if (!d.storageTouched) patch.storage = suggestStorage(name);
    if (!d.pantryId) {
      const m = matchPantry(name, pantry);
      if (m) {
        patch.pantryId = m;
        patch.unit = tx(pantry.find((p) => p.id === m)!.unit);
      }
    }
    upd(d.key, patch);
  };

  const fromShop = (id: string) => {
    const s = shop.find((x) => x.id === id);
    if (!s) return;
    const pantryId = matchPantry(s.name, pantry);
    addDraft({
      name: tx(s.name),
      qty: s.qty,
      unit: tx(s.unit),
      storage: suggestStorage(`${s.name} ${tx(s.name)}`),
      shopId: s.id,
      pantryId,
    });
  };

  const onCode = async (code: string) => {
    const target = scanFor;
    setScanFor(null);
    if (!target) return;
    let key = target;
    if (target === 'new') {
      const d = blank({ barcode: code });
      key = d.key;
      setSaved(null);
      setDrafts((ds) => [...ds, d]);
    } else {
      upd(target, { barcode: code });
    }
    const known = findKnownByBarcode(lots, code);
    if (known) {
      upd(key, { name: known.name, unit: known.unit, storage: known.storage, storageTouched: true, hint: L('Já registrado antes com esse código.', 'Already registered with this code before.') });
      return;
    }
    setBusy(key);
    try {
      const info = await lookupBarcode(code);
      if (info.found && info.name) {
        const name = info.name;
        const m = matchPantry(name, pantry);
        upd(key, {
          name,
          storage: suggestStorage(name),
          pantryId: m,
          ...(m ? { unit: tx(pantry.find((p) => p.id === m)!.unit) } : {}),
          hint: L(`Encontrado no Open Food Facts${info.quantity ? ` (${info.quantity})` : ''}. Confira o nome.`, `Found in Open Food Facts${info.quantity ? ` (${info.quantity})` : ''}. Check the name.`),
        });
      } else {
        upd(key, { hint: L('Código não encontrado na base online. Digite o nome: da próxima vez o app lembra.', 'Code not found in the online database. Type the name: next time the app will remember it.') });
      }
    } catch {
      upd(key, { hint: L('Sem consulta online agora. Digite o nome: da próxima vez o app lembra.', 'No online lookup right now. Type the name: next time the app will remember it.') });
    } finally {
      setBusy('');
    }
  };

  const valid = (d: Draft) => d.inStock && d.name.trim() && (d.qty ?? 0) > 0;
  const toSave = drafts.filter(valid);
  const skipped = drafts.filter((d) => !d.inStock).length;

  const saveAll = () => {
    const lines: string[] = [];
    let order = lots.reduce((m, l) => Math.max(m, l.order), 0);
    const used = lots.map((l) => ({ label: l.label }));
    const pantryAdd = new Map<string, { qty: number; exp?: string }>();
    for (const d of toSave) {
      const qty = d.qty!;
      const base = String(nextLabelBase(used));
      const parts = Math.max(1, Math.min(60, Math.floor(d.parts ?? 1)));
      const qs = splitQuantities(qty, parts);
      qs.forEach((q, i) => {
        const label = parts === 1 ? base : partLabel(base, i);
        used.push({ label });
        const lot: StockLot = {
          name: d.name.trim(),
          qty: q,
          unit: d.unit.trim() || L('un.', 'ea.'),
          expiresOn: d.expiresOn || undefined,
          storage: d.storage,
          place: d.place.trim() || undefined,
          label,
          splitFrom: parts > 1 ? base : undefined,
          purchasedOn: today,
          barcode: d.barcode,
          pantryId: d.pantryId,
          order: ++order,
        };
        store.put('lot', newId('lot'), lot);
        lines.push(`${labelText(lot)}  ·  ${lot.name} (${n1(q)} ${tx(lot.unit)})`);
      });
      if (d.pantryId) {
        const cur = pantryAdd.get(d.pantryId) ?? { qty: 0 };
        pantryAdd.set(d.pantryId, { qty: cur.qty + qty, exp: [cur.exp, d.expiresOn || undefined].filter(Boolean).sort()[0] });
      }
      if (d.shopId) store.patch<{ checked: boolean }>(d.shopId, (s) => ({ ...s, checked: true }));
    }
    for (const [id, add] of pantryAdd) {
      const p = pantry.find((x) => x.id === id);
      if (!p) continue;
      const exp = add.exp && (!p.expiresOn || add.exp < p.expiresOn) ? add.exp : p.expiresOn;
      savePantry(id, { haveQty: Math.round((p.haveQty + add.qty) * 100) / 100, expiresOn: exp });
    }
    setSaved({ lines, skipped });
    setDrafts([]);
  };

  /* ----- lista de lotes ----- */
  const q = norm(filter.trim());
  const shown = lots
    .filter((l) => !q || norm(`${l.name} ${l.label ?? ''} ${l.place ?? ''}`).includes(q))
    .sort((a, b) => (a.expiresOn ?? '9999') < (b.expiresOn ?? '9999') ? -1 : (a.expiresOn ?? '9999') > (b.expiresOn ?? '9999') ? 1 : a.order - b.order);
  const openShop = shop.filter((s) => !s.checked && s.store !== 'Reposição');

  return (
    <>
      {scanFor && <Scanner onCode={(c) => void onCode(c)} onClose={() => setScanFor(null)} />}
      <div class="topbar">
        <div>
          <h1>{L('Entrada de compras', 'Log purchases')}</h1>
          <div class="sub">{L('O que você comprou, com validade e etiqueta', 'What you bought, with expiry dates and labels')}</div>
        </div>
      </div>

      <Card>
        <div class="small">
          {L(
            'Registre o que você de fato comprou, mesmo que seja diferente da lista. Para cada item, diga se faz parte do estoque de emergência: o que não faz parte não é salvo nem controlado. Os que fazem ganham uma etiqueta curta para você escrever à caneta no pacote, e a validade passa a gerar alertas no Painel.',
            'Log what you actually bought, even if it differs from the list. For each item, say whether it is part of the emergency stock: what is not is not saved or tracked. The ones that are get a short label to write on the package with a pen, and the expiry date starts raising alerts on the Dashboard.',
          )}
        </div>
        <div class="row wrap" style={{ marginTop: 10 }}>
          <Btn kind="primary" onClick={() => addDraft()}>
            {L('Adicionar item', 'Add item')}
          </Btn>
          <Btn onClick={() => setScanFor('new')}>{L('Ler código de barras', 'Scan barcode')}</Btn>
        </div>
        {openShop.length > 0 && (
          <label class="field" style={{ marginTop: 10 }}>
            <span>{L('Trazer da lista de compras', 'Bring in from the shopping list')}</span>
            <select
              value=""
              onChange={(e) => {
                const v = (e.currentTarget as HTMLSelectElement).value;
                if (v) fromShop(v);
              }}
            >
              <option value="">{L('Escolha um item da lista...', 'Pick an item from the list...')}</option>
              {openShop.map((s) => (
                <option key={s.id} value={s.id}>
                  {tx(s.name)}
                </option>
              ))}
            </select>
          </label>
        )}
      </Card>

      {saved && (
        <Card>
          <h2>{L('Compra registrada', 'Purchase logged')}</h2>
          <div class="small">{L('Escreva isto nos pacotes (código · validade):', 'Write this on the packages (code · expiry):')}</div>
          <ul class="list" style={{ marginTop: 6 }}>
            {saved.lines.map((l, i) => (
              <li key={i} class="mono small">
                {l}
              </li>
            ))}
          </ul>
          {saved.skipped > 0 && (
            <div class="xs muted" style={{ marginTop: 6 }}>
              {L(`${saved.skipped} item(ns) marcado(s) como fora do estoque de emergência não foi(ram) salvo(s).`, `${saved.skipped} item(s) marked as outside the emergency stock were not saved.`)}
            </div>
          )}
        </Card>
      )}

      {drafts.map((d) => {
        const sugg = suggestStorage(d.name);
        const pantryOpts = [{ value: '', label: L('Não somar em nenhum', 'Do not add to any') }, ...pantry.map((p) => ({ value: p.id, label: tx(p.name) }))];
        const base = nextLabelBase(lots);
        const parts = Math.max(1, Math.floor(d.parts ?? 1));
        return (
          <Card key={d.key} class={d.inStock ? '' : 'flat'}>
            <div class="stack">
              <TextField label={L('Nome do item', 'Item name')} value={d.name} onChange={(v) => setName(d, v)} placeholder={L('Ex.: Atum albacore Kirkland', 'E.g. Kirkland albacore tuna')} />
              {busy === d.key && <div class="xs muted">{L('Consultando o código de barras...', 'Looking up the barcode...')}</div>}
              {d.hint && <div class="xs muted">{d.hint}</div>}
              <div class="grid2">
                <NumField label={L('Quantidade', 'Quantity')} value={d.qty} min={0} step="any" onChange={(v) => upd(d.key, { qty: v })} />
                <TextField label={L('Unidade', 'Unit')} value={d.unit} onChange={(v) => upd(d.key, { unit: v })} />
              </div>
              <Check checked={d.inStock} onChange={(v) => upd(d.key, { inStock: v })}>
                {L('Faz parte do estoque de emergência', 'Part of the emergency stock')}
              </Check>
              {!d.inStock && <div class="xs muted">{L('Este item não será salvo nem controlado pelo app.', 'This item will not be saved or tracked by the app.')}</div>}
              {d.inStock && (
                <>
                  <TextField label={L('Validade (data impressa)', 'Expiry date (printed)')} type="date" value={d.expiresOn} onChange={(v) => upd(d.key, { expiresOn: v })} />
                  <SelectField<StorageKey> label={L('Armazenagem', 'Storage')} value={d.storage} options={storageOptions()} onChange={(v) => upd(d.key, { storage: v, storageTouched: true })} />
                  <div class="xs muted">
                    {d.name.trim() && d.storage === sugg && sugg !== 'other' && <Pill tone="info">{L('Sugestão do app', 'App suggestion')}</Pill>} {storageTip(d.storage)}
                  </div>
                  <TextField label={L('Onde vai ficar (opcional)', 'Where it will be kept (optional)')} value={d.place} onChange={(v) => upd(d.key, { place: v })} placeholder={L('Ex.: Balde 3, Caixa 2', 'E.g. Bucket 3, Tote 2')} />
                  <NumField label={L('Dividir em quantos pacotes?', 'Split into how many packages?')} value={d.parts} min={1} step={1} onChange={(v) => upd(d.key, { parts: v })} />
                  <div class="xs muted">
                    {parts > 1
                      ? L(`Vira ${parts} itens, etiquetas ${base}a, ${base}b${parts > 2 ? '...' : ''}, ${n1((d.qty ?? 0) / parts)} ${d.unit} cada.`, `Becomes ${parts} items, labels ${base}a, ${base}b${parts > 2 ? '...' : ''}, ${n1((d.qty ?? 0) / parts)} ${d.unit} each.`)
                      : L(`Etiqueta: ${base}. Escreva no pacote com caneta. Dá para desmembrar depois.`, `Label: ${base}. Write it on the package with a pen. You can split it later.`)}
                  </div>
                  <SelectField<string>
                    label={L('Somar no "Tenho" da despensa', 'Add to the pantry "Have"')}
                    value={d.pantryId ?? ''}
                    options={pantryOpts}
                    onChange={(v) => {
                      const p = pantry.find((x) => x.id === v);
                      upd(d.key, { pantryId: v || undefined, ...(p ? { unit: tx(p.unit) } : {}) });
                    }}
                  />
                  {d.shopId && <div class="xs muted">{L('Vai marcar o item da lista de compras como comprado.', 'Will mark the shopping list item as bought.')}</div>}
                  {d.barcode && <div class="xs muted mono">{L('Código de barras: ', 'Barcode: ')}{d.barcode}</div>}
                </>
              )}
              <div class="row wrap">
                <Btn small onClick={() => setScanFor(d.key)}>
                  {L('Ler código de barras', 'Scan barcode')}
                </Btn>
                <Btn small kind="danger" onClick={() => setDrafts((ds) => ds.filter((x) => x.key !== d.key))}>
                  {L('Tirar esta linha', 'Remove this row')}
                </Btn>
              </div>
            </div>
          </Card>
        );
      })}

      {drafts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Btn kind="primary" block disabled={toSave.length === 0} onClick={saveAll}>
            {L(`Salvar ${toSave.length} item(ns) no estoque`, `Save ${toSave.length} item(s) to stock`)}
          </Btn>
          {skipped > 0 && <div class="xs muted" style={{ marginTop: 6 }}>{L(`${skipped} fora do estoque de emergência: não serão salvos.`, `${skipped} outside the emergency stock: will not be saved.`)}</div>}
        </div>
      )}

      <h2>{L(`Itens guardados (${lots.length})`, `Stored items (${lots.length})`)}</h2>
      {lots.length > 8 && <TextField label={L('Buscar por nome, etiqueta ou local', 'Search by name, label or place')} value={filter} onChange={setFilter} />}
      {lots.length === 0 && <p class="small muted">{L('Nada registrado ainda. Use "Adicionar item" ou o código de barras.', 'Nothing logged yet. Use "Add item" or the barcode.')}</p>}
      <Card class={lots.length === 0 ? 'flat' : ''}>
        <ul class="list">
          {shown.map((l) => (
            <LotRow key={l.id} l={l} today={today} all={lots} />
          ))}
        </ul>
      </Card>
    </>
  );
}

function LotRow({ l, today, all }: { l: StockLot & { id: string }; today: string; all: (StockLot & { id: string })[] }) {
  const [mode, setMode] = useState<'' | 'edit' | 'split' | 'use'>('');
  const st = lotStatus(l, today);
  const pantry = usePantry();
  return (
    <li>
      <div class="row" style={{ alignItems: 'flex-start' }}>
        <div class="grow">
          <div style={{ fontWeight: 600 }}>{l.name}</div>
          <div class="xs muted mono">
            {n1(l.qty)} {tx(l.unit)} · {storageLabel(l.storage)}
            {l.place ? ` · ${l.place}` : ''}
          </div>
          <div class="row wrap" style={{ marginTop: 4, gap: 6 }}>
            {l.label && <span class="label-chip">{l.label}</span>}
            {l.expiresOn ? (
              <Pill tone={st.tone}>{st.tone === 'bad' ? L(`Vencido em ${fmtDate(l.expiresOn)}`, `Expired on ${fmtDate(l.expiresOn)}`) : st.tone === 'warn' ? L(`Vence em ${st.days} dias`, `Expires in ${st.days} days`) : L(`Vence em ${fmtDate(l.expiresOn)}`, `Expires on ${fmtDate(l.expiresOn)}`)}</Pill>
            ) : (
              <Pill tone="neutral">{L('Sem validade', 'No expiry date')}</Pill>
            )}
          </div>
          {(l.label || l.expiresOn) && (
            <div class="xs faint" style={{ marginTop: 4 }}>
              {L('Escreva no pacote: ', 'Write on the package: ')}
              <span class="mono">{labelText(l)}</span>
            </div>
          )}
        </div>
        <Btn small onClick={() => setMode(mode ? '' : 'edit')}>
          {mode ? L('Fechar', 'Close') : L('Abrir', 'Open')}
        </Btn>
      </div>
      {mode && (
        <div style={{ marginTop: 10 }}>
          <div class="row wrap" style={{ marginBottom: 10 }}>
            <Btn small kind={mode === 'edit' ? 'primary' : ''} onClick={() => setMode('edit')}>
              {L('Editar', 'Edit')}
            </Btn>
            <Btn small kind={mode === 'split' ? 'primary' : ''} onClick={() => setMode('split')}>
              {L('Desmembrar', 'Split')}
            </Btn>
            <Btn small kind={mode === 'use' ? 'primary' : ''} onClick={() => setMode('use')}>
              {L('Consumir', 'Use up')}
            </Btn>
          </div>
          {mode === 'edit' && <EditLot l={l} />}
          {mode === 'split' && <SplitLot l={l} all={all} done={() => setMode('')} />}
          {mode === 'use' && <UseLot l={l} pantryName={l.pantryId ? pantry.find((p) => p.id === l.pantryId)?.name : undefined} done={() => setMode('')} />}
        </div>
      )}
    </li>
  );
}

function EditLot({ l }: { l: StockLot & { id: string } }) {
  return (
    <div class="stack">
      <TextField label={L('Nome', 'Name')} value={l.name} onChange={(v) => saveLot(l.id, { name: v })} />
      <div class="grid2">
        <NumField label={L('Quantidade', 'Quantity')} value={l.qty} min={0} onChange={(v) => saveLot(l.id, { qty: Math.max(0, v ?? 0) })} />
        <TextField label={L('Unidade', 'Unit')} value={l.unit} onChange={(v) => saveLot(l.id, { unit: v })} />
      </div>
      <TextField label={L('Validade', 'Expiry date')} type="date" value={l.expiresOn ?? ''} onChange={(v) => saveLot(l.id, { expiresOn: v || undefined })} />
      <SelectField<StorageKey> label={L('Armazenagem', 'Storage')} value={l.storage} options={storageOptions()} onChange={(v) => saveLot(l.id, { storage: v })} />
      <div class="xs muted">{storageTip(l.storage)}</div>
      <div class="grid2">
        <TextField label={L('Etiqueta', 'Label')} value={l.label ?? ''} onChange={(v) => saveLot(l.id, { label: v || undefined })} />
        <TextField label={L('Onde está', 'Where it is')} value={l.place ?? ''} onChange={(v) => saveLot(l.id, { place: v || undefined })} />
      </div>
      <TextField label={L('Observação', 'Note')} value={l.note ?? ''} onChange={(v) => saveLot(l.id, { note: v || undefined })} />
      <div>
        <Btn small kind="danger" onClick={() => store.remove(l.id)}>
          {L('Tirar do controle', 'Stop tracking')}
        </Btn>
        <div class="xs muted" style={{ marginTop: 4 }}>
          {L('Apaga só o registro do lote. O "Tenho" da despensa não muda.', 'Only deletes the batch record. The pantry "Have" does not change.')}
        </div>
      </div>
    </div>
  );
}

function SplitLot({ l, all, done }: { l: StockLot & { id: string }; all: (StockLot & { id: string })[]; done: () => void }) {
  const [n, setN] = useState<number | undefined>(2);
  const count = Math.max(2, Math.min(60, Math.floor(n ?? 2)));
  const [qtys, setQtys] = useState<(number | undefined)[] | null>(null);
  const [exps, setExps] = useState<string[]>([]);
  const parts = qtys && qtys.length === count ? qtys : splitQuantities(l.qty, count);
  const sum = Math.round(parts.reduce<number>((s, x) => s + (x ?? 0), 0) * 100) / 100;
  const ok = Math.abs(sum - l.qty) < 0.005 && parts.every((x) => (x ?? 0) > 0);
  const base = l.label || String(nextLabelBase(all));

  const apply = () => {
    const order = all.reduce((m, x) => Math.max(m, x.order), 0) + 1;
    const r = splitLot(l, parts.map((q, i) => ({ qty: q!, expiresOn: exps[i] || undefined })), base, newId, order);
    for (const p of r.puts) store.put('lot', p.id, p.data);
    store.remove(r.removeId);
    done();
  };

  return (
    <div class="stack">
      <NumField label={L('Em quantos pacotes?', 'Into how many packages?')} value={n} min={2} step={1} onChange={(v) => { setN(v); setQtys(null); }} />
      <div class="xs muted">{L(`Total: ${n1(l.qty)} ${l.unit}. As etiquetas serão ${childLabel(base, 0)}, ${childLabel(base, 1)}${count > 2 ? '...' : ''}.`, `Total: ${n1(l.qty)} ${tx(l.unit)}. Labels will be ${childLabel(base, 0)}, ${childLabel(base, 1)}${count > 2 ? '...' : ''}.`)}</div>
      {parts.map((q, i) => (
        <div class="grid2" key={i}>
          <NumField
            label={`${childLabel(base, i)} (${tx(l.unit)})`}
            value={q}
            min={0}
            onChange={(v) => {
              const next = [...parts];
              next[i] = v;
              setQtys(next);
            }}
          />
          <TextField label={L('Validade (se diferente)', 'Expiry (if different)')} type="date" value={exps[i] ?? l.expiresOn ?? ''} onChange={(v) => { const e = [...exps]; e[i] = v; setExps(e); }} />
        </div>
      ))}
      {!ok && <div class="xs" style={{ color: 'var(--warn)' }}>{L(`As partes somam ${n1(sum)} e o lote tem ${n1(l.qty)} ${l.unit}. Ajuste para fechar.`, `The parts add up to ${n1(sum)} and the batch has ${n1(l.qty)} ${l.unit}. Adjust to match.`)}</div>}
      <div>
        <Btn kind="primary" disabled={!ok} onClick={apply}>
          {L(`Desmembrar em ${count}`, `Split into ${count}`)}
        </Btn>
        <div class="xs muted" style={{ marginTop: 4 }}>{L('O lote original sai e os novos entram, cada um com a sua etiqueta.', 'The original batch is removed and the new ones come in, each with its own label.')}</div>
      </div>
    </div>
  );
}

function UseLot({ l, pantryName, done }: { l: StockLot & { id: string }; pantryName?: string; done: () => void }) {
  const [amount, setAmount] = useState<number | undefined>(1);
  const pantry = usePantry();
  const apply = (all: boolean) => {
    const r = consumeLot(l, all ? l.qty : amount ?? 0);
    if (r.used <= 0) return;
    if (r.lot) store.put('lot', l.id, r.lot);
    else store.remove(l.id);
    const p = l.pantryId ? pantry.find((x) => x.id === l.pantryId) : undefined;
    if (p) savePantry(p.id, { haveQty: Math.max(0, Math.round((p.haveQty - r.used) * 100) / 100) });
    done();
  };
  return (
    <div class="stack">
      <NumField label={`${L('Quanto usou', 'How much you used')} (${l.unit})`} value={amount} min={0} onChange={setAmount} />
      <div class="row wrap">
        <Btn kind="primary" disabled={!amount || amount <= 0} onClick={() => apply(false)}>
          {L('Registrar uso', 'Log usage')}
        </Btn>
        <Btn onClick={() => apply(true)}>{L('Usei tudo', 'Used it all')}</Btn>
      </div>
      {pantryName && <div class="xs muted">{L(`Também desconta do "Tenho" de ${tx(pantryName)}.`, `Also subtracts from the "Have" of ${tx(pantryName)}.`)}</div>}
    </div>
  );
}

