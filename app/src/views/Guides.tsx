import { useState } from 'preact/hooks';
import { Card } from '../components/ui';
import { GUIDES } from '../content/guides';

export function Guides({ openId }: { openId?: string }) {
  const [open, setOpen] = useState<string | undefined>(openId);
  return (
    <>
      <div class="topbar">
        <div>
          <h1>Guias</h1>
          <div class="sub">Procedimentos e a base dos cálculos</div>
        </div>
      </div>

      {GUIDES.map((g) => (
        <details
          class="card"
          key={g.id}
          open={open === g.id}
          onToggle={(e) => {
            const el = e.currentTarget as HTMLDetailsElement;
            if (el.open) setOpen(g.id);
            else if (open === g.id) setOpen(undefined);
          }}
        >
          <summary>
            <b>{g.title}</b>
            <div class="xs muted">{g.summary}</div>
          </summary>

          {g.intro?.map((p, i) => (
            <p class="small" key={i}>
              {p}
            </p>
          ))}

          {g.steps && (
            <ol class="steps">
              {g.steps.map((s) => (
                <li key={s.title}>
                  <b>{s.title}</b>
                  <span class="small">{s.text}</span>
                </li>
              ))}
            </ol>
          )}

          {g.notes && (
            <div class="banner">
              <b>Atenção</b>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {g.notes.map((n) => (
                  <li key={n} class="small">
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {g.estimates && (
            <div class="banner">
              <b>Estimativas do app</b>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {g.estimates.map((n) => (
                  <li key={n} class="small">
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {g.sources.length > 0 && (
            <ul class="sources" style={{ paddingLeft: 18 }}>
              {g.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </details>
      ))}

      <Card>
        <div class="xs muted">
          O KeepReady é uma ferramenta de organização, não um aconselhamento médico, de segurança ou de nutrição. Confira as fontes e use o bom senso, principalmente com gás, fogo e pessoas com necessidades especiais.
        </div>
      </Card>
    </>
  );
}
