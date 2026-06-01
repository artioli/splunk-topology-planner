import { getHashParams } from '../nav';
import { enMessages } from './locales/en';
import { esMessages } from './locales/es';
import { ptMessages } from './locales/pt';
import { loadStoredLocale, localeFromParam, saveStoredLocale } from './localeStorage';
import type { Locale, MessageParams } from './types';

const catalogs: Record<Locale, Record<string, string>> = {
  en: enMessages,
  pt: ptMessages,
  es: esMessages,
};

let currentLocale: Locale = loadStoredLocale();
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale, persist = true): void {
  currentLocale = locale;
  if (persist) saveStoredLocale(locale);
  listeners.forEach((fn) => fn());
}

export function subscribeLocale(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initLocaleFromHash(): void {
  const param = localeFromParam(getHashParams().get('lang'));
  if (param) setLocale(param, true);
}

export function t(key: string, params?: MessageParams): string {
  const catalog = catalogs[currentLocale] ?? catalogs.en;
  let msg = catalog[key] ?? catalogs.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return msg;
}

export function profileLabelKey(profileId: string): string {
  return `profiles.${profileId}.label`;
}

export function profileDescriptionKey(profileId: string): string {
  return `profiles.${profileId}.description`;
}

export function profileSvaHintKey(profileId: string): string {
  return `profiles.${profileId}.svaHint`;
}

export function targetLabelKey(target: string): string {
  return `guide.targets.${target}`;
}

export function stepPhaseKey(stepId: string): string {
  return `steps.${stepId}.phase`;
}

export function stepTitleKey(stepId: string): string {
  return `steps.${stepId}.title`;
}

export function allLocaleKeys(): string[] {
  return Object.keys(catalogs.en);
}

export function localeKeyParity(): { missingInPt: string[]; missingInEs: string[] } {
  const enKeys = new Set(Object.keys(catalogs.en));
  const missingInPt = [...enKeys].filter((k) => !(k in catalogs.pt));
  const missingInEs = [...enKeys].filter((k) => !(k in catalogs.es));
  return { missingInPt, missingInEs };
}

export function resolveMessage(message: { key: string; params?: MessageParams }): string {
  const params: MessageParams = { ...(message.params ?? {}) };
  if (typeof params.autoSuffixKey === 'string') {
    params.autoSuffix = t(params.autoSuffixKey);
    delete params.autoSuffixKey;
  }
  return t(message.key, params);
}
