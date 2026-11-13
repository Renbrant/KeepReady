import { describe, expect, it } from 'vitest';
import { memberTarget, recommendationNote, recommendedKcal, SPHERE_KCAL } from '../src/lib/nutrition';

describe('recomendação de calorias (Dietary Guidelines)', () => {
  it('adultos de 31 a 50: mulher 1.800/2.000/2.200 e homem 2.400/2.600/3.000 (ou 2.200/2.400/2.800 aos 46–50)', () => {
    expect(recommendedKcal('F', 35, 'sedentary')).toBe(1800);
    expect(recommendedKcal('F', 35, 'moderate')).toBe(2000);
    expect(recommendedKcal('F', 35, 'active')).toBe(2200);
    expect(recommendedKcal('M', 35, 'sedentary')).toBe(2400);
    expect(recommendedKcal('M', 48, 'moderate')).toBe(2400);
  });

  it('idosos de 76 anos ou mais', () => {
    expect(recommendedKcal('F', 80, 'moderate')).toBe(1800);
    expect(recommendedKcal('M', 80, 'active')).toBe(2400);
  });

  it('crianças e adolescentes', () => {
    expect(recommendedKcal('M', 2, 'moderate')).toBe(1000);
    expect(recommendedKcal('F', 8, 'moderate')).toBe(1600);
    expect(recommendedKcal('M', 16, 'active')).toBe(3200);
  });

  it('sem sexo, sem idade ou menor de 2 anos: sem recomendação', () => {
    expect(recommendedKcal(undefined, 30, 'moderate')).toBeNull();
    expect(recommendedKcal('F', undefined, 'moderate')).toBeNull();
    expect(recommendedKcal('F', 1, 'moderate')).toBeNull();
  });

  it('a meta do usuário vale mais que a recomendação', () => {
    expect(memberTarget({ name: 'A', sex: 'F', age: 35, activity: 'moderate', order: 1 })).toBe(2000);
    expect(memberTarget({ name: 'A', sex: 'F', age: 35, activity: 'moderate', kcalOverride: 2500, order: 1 })).toBe(2500);
    expect(memberTarget({ name: 'A', activity: 'moderate', order: 1 })).toBe(0);
  });

  it('explica quando a tabela não se aplica', () => {
    expect(recommendationNote({ name: 'A', sex: 'F', age: 30, activity: 'moderate', pregnantOrNursing: true, order: 1 })).toMatch(/Gestante/);
    expect(recommendationNote({ name: 'A', sex: 'M', age: 1, activity: 'moderate', order: 1 })).toMatch(/Menor de 2/);
    expect(recommendationNote({ name: 'A', activity: 'moderate', order: 1 })).toMatch(/idade e sexo/);
    expect(recommendationNote({ name: 'A', sex: 'M', age: 30, activity: 'moderate', order: 1 })).toBeNull();
  });

  it('referência de emergência Sphere é 2.100', () => {
    expect(SPHERE_KCAL).toBe(2100);
  });
});
