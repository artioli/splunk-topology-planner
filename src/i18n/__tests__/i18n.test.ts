import { describe, expect, it } from 'vitest';
import { allLocaleKeys, localeKeyParity, setLocale, t } from '../index';

describe('i18n', () => {
  it('en, pt, and es have identical key sets', () => {
    const { missingInPt, missingInEs } = localeKeyParity();
    expect(missingInPt).toEqual([]);
    expect(missingInEs).toEqual([]);
  });

  it('returns key when missing from catalog', () => {
    setLocale('en', false);
    expect(t('nonexistent.key.xyz')).toBe('nonexistent.key.xyz');
  });

  it('interpolates params', () => {
    setLocale('en', false);
    expect(t('guide.progress', { done: 2, total: 10 })).toContain('2');
    expect(t('guide.progress', { done: 2, total: 10 })).toContain('10');
  });

  it('has guide and planner keys', () => {
    const keys = allLocaleKeys();
    expect(keys.some((k) => k.startsWith('guide.'))).toBe(true);
    expect(keys.some((k) => k.startsWith('planner.'))).toBe(true);
    expect(keys.some((k) => k.startsWith('steps.'))).toBe(true);
  });
});
