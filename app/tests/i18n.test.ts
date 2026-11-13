import { afterAll, describe, expect, it } from 'vitest';
import { L, setLang, tx } from '../src/lib/i18n';
import { getGuides } from '../src/content/guides';
import { CATALOG } from '../src/content/catalog';
import { CATALOG_EN } from '../src/content/catalog.en';
import { GUIDES } from '../src/content/guides';
import { GUIDES_EN } from '../src/content/guides.en';

describe('idiomas', () => {
  afterAll(() => setLang('en'));

  it('L escolhe o texto do idioma atual', () => {
    setLang('pt');
    expect(L('olá', 'hello')).toBe('olá');
    setLang('en');
    expect(L('olá', 'hello')).toBe('hello');
  });

  it('tx traduz textos guardados e padrões; deixa o desconhecido como está', () => {
    setLang('en');
    expect(tx('Arroz')).toBe('Rice');
    expect(tx('Balde 3')).toBe('Bucket 3');
    expect(tx('Balde 7 (misto)')).toBe('Bucket 7 (mixed)');
    expect(tx('Feijão (reposição do Balde 2)')).toBe('Beans (replacement for Bucket 2)');
    expect(tx('Rende cerca de 2,7 dias para a família.')).toBe('Lasts about 2.7 days for the family.');
    expect(tx('Meu item')).toBe('Meu item');
    setLang('pt');
    expect(tx('Arroz')).toBe('Arroz');
  });

  it('catálogo e guias em inglês cobrem tudo do português', () => {
    for (const c of CATALOG) expect(CATALOG_EN[c.id], c.id).toBeTruthy();
    expect(GUIDES_EN.map((g) => g.id)).toEqual(GUIDES.map((g) => g.id));
    for (const g of GUIDES) {
      const e = GUIDES_EN.find((x) => x.id === g.id)!;
      expect(e.steps?.length ?? 0).toBe(g.steps?.length ?? 0);
      expect(e.notes?.length ?? 0).toBe(g.notes?.length ?? 0);
      expect(e.sources.length).toBe(g.sources.length);
    }
    setLang('en');
    expect(getGuides()).toBe(GUIDES_EN);
  });
});
