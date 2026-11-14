import { useState } from 'preact/hooks';
import { Card } from '../components/ui';
import { getGuides } from '../content/guides';
import { useLang } from '../lib/i18n';
import { L } from '../lib/i18n';

export function Guides({ openId }: { openId?: string }) {
  useLang();
  const GUIDES = getGuides();
  const [open, setOpen] = useState<string | undefined>(openId);
  return (
    <>
      <div class="topbar">
        <div>
          <h1>{L('Guias', 'Guides')}</h1>
          <div class="sub">{L('Procedimentos e a base dos cálculos', 'Procedures and the basis of the calculations')}</div>
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
              <b>{L('Atenção', 'Heads up')}</b>
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
              <b>{L('Estimativas do app', 'App estimates')}</b>
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
          {L('O KeepReady é uma ferramenta de organização, não um aconselhamento médico, de segurança ou de nutrição. Confira as fontes e use o bom senso, principalmente com gás, fogo e pessoas com necessidades especiais.', 'KeepReady is an organizing tool, not medical, safety or nutrition advice. Check the sources and use good judgment, especially with gas, fire and people with special needs.')}
        </div>
      </Card>
    </>
  );
}
