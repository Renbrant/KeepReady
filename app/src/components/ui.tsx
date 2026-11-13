import type { ComponentChildren, JSX } from 'preact';
import { daysFmt } from '../lib/fmt';

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

export function toneFor(days: number, target: number): Tone {
  if (days <= 0) return 'neutral';
  if (days >= target) return 'ok';
  if (days >= target * 0.5) return 'warn';
  return 'bad';
}

export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ComponentChildren }) {
  return <span class={`pill ${tone}`}>{children}</span>;
}

export function Card({ children, tone, class: cls = '' }: { children: ComponentChildren; tone?: 'bad' | 'warn'; class?: string }) {
  return <section class={`card ${tone ? `alert-${tone}` : ''} ${cls}`}>{children}</section>;
}

export function Ring({ value, size = 140, stroke = 12, tone, big, label }: { value: number; size?: number; stroke?: number; tone: Tone; big: string; label: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div class="ring" style={{ width: size, height: size }} role="img" aria-label={`${big} ${label}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track)" stroke-width={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`var(--${tone})`}
          stroke-width={stroke}
          stroke-linecap="round"
          stroke-dasharray={c}
          stroke-dashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div class="center">
        <div class="big" style={{ fontSize: size * 0.27 }}>
          {big}
        </div>
        <div class="lab">{label}</div>
      </div>
    </div>
  );
}

export function Gauge({ name, days, target, sub }: { name: string; days: number; target: number; sub?: string }) {
  const tone = toneFor(days, target);
  const pct = target > 0 ? Math.min(100, (days / target) * 100) : 0;
  return (
    <div class="gauge" style={{ '--c': `var(--${tone})` } as JSX.CSSProperties}>
      <div class="name">{name}</div>
      <div class="val">
        {daysFmt(days)}
        <span class="small muted"> d</span>
      </div>
      <div class="track">
        <div class="fill" style={{ width: `${pct}%` }} />
      </div>
      {sub && <div class="xs muted" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  kind = '',
  small,
  disabled,
  block,
  type = 'button',
}: {
  children: ComponentChildren;
  onClick?: () => void;
  kind?: 'primary' | 'danger' | '';
  small?: boolean;
  disabled?: boolean;
  block?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button type={type} class={`btn ${kind} ${small ? 'small' : ''} ${block ? 'block' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function NumField({
  label,
  value,
  onChange,
  step,
  min,
  suffix,
  placeholder,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  step?: number | string;
  min?: number;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <label class="field">
      <span>
        {label}
        {suffix ? ` (${suffix})` : ''}
      </span>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        step={step ?? 'any'}
        min={min}
        placeholder={placeholder}
        onInput={(e) => {
          const raw = (e.currentTarget as HTMLInputElement).value;
          const n = Number(raw);
          onChange(raw === '' || !Number.isFinite(n) ? undefined : n);
        }}
      />
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autocomplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'email' | 'password' | 'date';
  placeholder?: string;
  autocomplete?: string;
}) {
  return (
    <label class="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autocomplete={autocomplete}
        onInput={(e) => onChange((e.currentTarget as HTMLInputElement).value)}
      />
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label class="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange((e.currentTarget as HTMLSelectElement).value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ComponentChildren }) {
  return (
    <label class="row" style={{ cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange((e.currentTarget as HTMLInputElement).checked)} />
      <span>{children}</span>
    </label>
  );
}

/* Ícones da barra inferior (traço simples, 24×24). */
const ICONS: Record<string, JSX.Element> = {
  painel: (
    <>
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </>
  ),
  estoque: (
    <>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>
  ),
  rotacao: (
    <>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </>
  ),
  compras: (
    <>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </>
  ),
  mais: (
    <>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </>
  ),
};

export function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}
