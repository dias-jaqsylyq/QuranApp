import { useCallback, useMemo } from 'react';
import { useSettings } from '../context/AppContext';
import { t as translate, resolveLocale } from '../i18n';

export function useI18n() {
  const { defaultLang } = useSettings();
  const lang = defaultLang || 'en';
  const locale = resolveLocale(lang);

  const t = useCallback(
    (key, params) => translate(lang, key, params),
    [lang],
  );

  return useMemo(() => ({ t, lang, locale }), [t, lang, locale]);
}
