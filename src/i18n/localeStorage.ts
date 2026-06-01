import type { Locale } from './types';

const STORAGE_KEY = 'splunk-topology-planner-locale';

export function loadStoredLocale(): Locale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'pt' || raw === 'es' || raw === 'en') return raw;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function saveStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function localeFromParam(value: string | null): Locale | null {
  if (value === 'en' || value === 'pt' || value === 'es') return value;
  return null;
}
