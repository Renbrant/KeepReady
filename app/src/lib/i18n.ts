/**
 * Idiomas: inglês (padrão) e português. O português é o texto original do app.
 * - L(pt, en): par de textos lado a lado, escolhido pelo idioma atual.
 * - tx(texto): traduz nomes e notas guardados no banco (sempre em português) para exibição em inglês. Texto que você digitou fica como está.
 */
import { useEffect, useState } from 'preact/hooks';
import { STORED_EN } from '../content/stored-en';

export type Lang = 'en' | 'pt';
const KEY = 'kr.lang';
/** Idioma de quem ainda não escolheu. */
const DEFAULT_LANG: Lang = 'pt';

function load(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'pt' || v === 'en') return v;
  } catch {
    /* sem armazenamento: usa o padrão */
  }
  return DEFAULT_LANG;
}

let current: Lang = load();
const subs = new Set<() => void>();

export function getLang(): Lang {
  return current;
}

export function setLang(l: Lang): void {
  current = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* ignora */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en';
  subs.forEach((f) => f());
}

if (typeof document !== 'undefined') document.documentElement.lang = current === 'pt' ? 'pt-BR' : 'en';

/** Re-renderiza o componente quando o idioma muda. */
export function useLang(): Lang {
  const [, set] = useState(0);
  useEffect(() => {
    const f = () => set((n) => n + 1);
    subs.add(f);
    return () => void subs.delete(f);
  }, []);
  return current;
}

/** Par de textos: português e inglês. */
export function L(pt: string, en: string): string {
  return current === 'en' ? en : pt;
}

/** Locale para números e datas. */
export function locale(): string {
  return current === 'en' ? 'en-US' : 'pt-BR';
}

/** Traduz um texto guardado em português (nome de item, nota) quando o app está em inglês. Desconhecido fica igual. */
export function tx(s: string | undefined): string {
  if (!s) return s ?? '';
  if (current !== 'en') return s;
  return STORED_EN[s] ?? s;
}
