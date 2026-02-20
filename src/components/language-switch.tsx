import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { normalizeLang, withLang } from '../i18n/url'

export function LanguageSwitch() {
  const { i18n, t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const current = normalizeLang(i18n.resolvedLanguage || 'ru')

  const change = useCallback((lng: 'ru' | 'en') => {
    if (lng === current) return
    i18n.changeLanguage(lng)
    const nextPath = withLang(`${location.pathname}${location.search}${location.hash}`, lng)
    navigate(nextPath, { replace: true })
  }, [current, i18n, location.hash, location.pathname, location.search, navigate])

  const isRu = current === 'ru'

  return (
    <div className="inline-flex items-center" role="group" aria-label={t('lang.switch')}>
      <button
        type="button"
        onClick={() => change('ru')}
        className="group relative inline-flex items-center px-2.5 py-1.5 text-[13px] font-medium tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md"
        aria-pressed={isRu}
        aria-label={t('lang.ru')}
      >
        <span className={isRu ? 'text-white' : 'text-white/70 group-hover:text-white transition-colors'}>
          ru
        </span>
        <span
          className={`pointer-events-none absolute left-2.5 right-2.5 -bottom-0.5 h-px transition-opacity duration-150 ${
            isRu ? 'opacity-100 bg-white/80' : 'opacity-0 group-hover:opacity-100 bg-white/60'
          }`}
        />
      </button>
      <span className="mx-1.5 h-4 w-px bg-white/10" aria-hidden="true" />
      <button
        type="button"
        onClick={() => change('en')}
        className="group relative inline-flex items-center px-2.5 py-1.5 text-[13px] font-medium tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md"
        aria-pressed={!isRu}
        aria-label={t('lang.en')}
      >
        <span className={!isRu ? 'text-white' : 'text-white/70 group-hover:text-white transition-colors'}>
          en
        </span>
        <span
          className={`pointer-events-none absolute left-2.5 right-2.5 -bottom-0.5 h-px transition-opacity duration-150 ${
            !isRu ? 'opacity-100 bg-white/80' : 'opacity-0 group-hover:opacity-100 bg-white/60'
          }`}
        />
      </button>
    </div>
  );
}
