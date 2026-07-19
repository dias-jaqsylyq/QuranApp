import en from './en';
import ru from './ru';
import kk from './kk';

export const dictionaries = { en, ru, kk };

/** Map app `defaultLang` (en|ru|kz) → dictionary code (en|ru|kk). */
export function resolveLocale(defaultLang) {
  if (defaultLang === 'ru') return 'ru';
  if (defaultLang === 'kz') return 'kk';
  return 'en';
}

function lookup(dict, key) {
  if (!dict || !key) return undefined;
  const parts = key.split('.');
  let cur = dict;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

/**
 * Translate a namespaced key. Falls back to English, then the key itself.
 * Supports {{param}} interpolation.
 */
export function t(lang, key, params) {
  const locale = resolveLocale(lang);
  let str = lookup(dictionaries[locale], key)
    ?? lookup(dictionaries.en, key)
    ?? key;

  if (params && typeof str === 'string') {
    str = str.replace(/\{\{(\w+)\}\}/g, (_, name) => (
      params[name] != null ? String(params[name]) : `{{${name}}}`
    ));
  }
  return str;
}
