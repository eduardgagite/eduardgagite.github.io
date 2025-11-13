import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export function LanguageSwitch() {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage || 'ru';

  const change = useCallback((lng: 'ru' | 'en') => {
    if (lng === current) return;
    i18n.changeLanguage(lng);
  }, [current, i18n]);

  const isRu = current === 'ru';

  return (
    <div className="inline-flex items-center rounded-md bg-white/[0.04] px-2 py-1 ring-1 ring-white/10">
      <span className="mr-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">lang</span>
      <div className="relative flex items-center gap-1 font-mono text-[12px]">
        <span className="text-white/40">[</span>

        <button
          type="button"
          onClick={() => change('ru')}
          className="relative px-1.5 py-0.5"
          aria-pressed={isRu}
          aria-label={t('lang.ru')}
        >
          <span className={isRu ? 'text-emerald-300' : 'text-white/60 hover:text-white transition-colors'}>
            ru
          </span>
          {isRu && (
            <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
          )}
        </button>

        <span className="text-white/40">|</span>

        <button
          type="button"
          onClick={() => change('en')}
          className="relative px-1.5 py-0.5"
          aria-pressed={!isRu}
          aria-label={t('lang.en')}
        >
          <span className={!isRu ? 'text-emerald-300' : 'text-white/60 hover:text-white transition-colors'}>
            en
          </span>
          {!isRu && (
            <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
          )}
        </button>

        <span className="text-white/40">]</span>
      </div>
    </div>
  );
}


