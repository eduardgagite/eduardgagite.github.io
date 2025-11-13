import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export function LanguageSwitch() {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage || 'ru';

  const change = useCallback((lng: 'ru' | 'en') => {
    if (lng === current) return;
    i18n.changeLanguage(lng);
  }, [current, i18n]);

  return (
    <div className="inline-flex items-center rounded-lg bg-white/5 ring-1 ring-white/10 p-0.5 text-sm">
      <button
        type="button"
        onClick={() => change('ru')}
        className={`px-2.5 py-1 rounded-md transition ${
          current === 'ru' ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white'
        }`}
        aria-pressed={current === 'ru'}
        aria-label={t('lang.ru')}
      >
        {t('lang.ru')}
      </button>
      <button
        type="button"
        onClick={() => change('en')}
        className={`px-2.5 py-1 rounded-md transition ${
          current === 'en' ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white'
        }`}
        aria-pressed={current === 'en'}
        aria-label={t('lang.en')}
      >
        {t('lang.en')}
      </button>
    </div>
  );
}


