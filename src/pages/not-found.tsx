import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { resetSEO, updateSEO } from '../utils/seo'

export function NotFound() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const lang = (i18n.resolvedLanguage || 'ru') === 'ru' ? 'ru' : 'en'

  useEffect(() => {
    const title = t('notFound.title') || (lang === 'ru' ? 'Страница не найдена — Eduard Gagite' : 'Page not found — Eduard Gagite')
    const description =
      t('notFound.description') ||
      (lang === 'ru' ? 'Похоже, ссылка неверная или страница была перемещена.' : 'The link looks wrong or the page has been moved.')
    const url = `https://eduardgagite.github.io${location.pathname}${location.search}`
    updateSEO({
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogUrl: url,
      ogType: 'website',
      ogLocale: lang === 'ru' ? 'ru_RU' : 'en_US',
      canonical: url,
    })
    return () => {
      resetSEO()
    }
  }, [lang, location.pathname, location.search, t])

  return (
    <section className="h-full w-full flex items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-8">
      <div className="relative w-full max-w-md">
        {/* Glow effect */}
        <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_center,_rgba(31,111,235,0.25),_transparent_70%)] opacity-80 blur-3xl scale-150" />
        
        {/* Card */}
        <div className="relative rounded-[28px] border border-theme-border bg-theme-surface/80 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1 bg-gradient-to-r from-transparent via-theme-accent/60 to-transparent" />
          
          <div className="p-8 sm:p-10 text-center">
            {/* 404 number with gradient */}
            <div className="relative inline-block">
              <span className="text-[120px] sm:text-[140px] font-bold leading-none bg-gradient-to-b from-theme-text/20 via-theme-text/10 to-transparent bg-clip-text text-transparent select-none">
                404
              </span>
              {/* Floating accent */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-theme-accent/30 to-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shadow-lg shadow-theme-accent/10">
                  <svg className="w-8 h-8 text-theme-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Text content */}
            <h1 className="mt-4 text-xl sm:text-2xl font-semibold text-theme-text">
              {t('notFound.heading') || (lang === 'ru' ? 'Страница не найдена' : 'Page not found')}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-theme-text-subtle max-w-xs mx-auto">
              {t('notFound.hint') ||
                (lang === 'ru'
                  ? 'Проверьте адрес или вернитесь на главную. Возможно страница была перемещена.'
                  : 'Check the URL or go back home. The page might have been moved.')}
            </p>
            
            {/* Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={`/?lang=${lang}`}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-theme-accent/20 to-theme-accent/10 border border-theme-accent/30 px-5 py-2.5 text-sm font-medium text-theme-text hover:from-theme-accent/30 hover:to-theme-accent/20 hover:border-theme-accent/40 transition-all shadow-lg shadow-theme-accent/5"
              >
                <svg className="w-4 h-4 text-theme-accent transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t('notFound.goHome') || (lang === 'ru' ? 'На главную' : 'Go home')}
              </Link>
              <Link
                to={`/materials?lang=${lang}`}
                className="group inline-flex items-center gap-2 rounded-xl bg-theme-surface-elevated border border-theme-border px-5 py-2.5 text-sm font-medium text-theme-text-secondary hover:bg-theme-card hover:border-theme-border-hover hover:text-theme-text transition-all"
              >
                {t('notFound.goMaterials') || (lang === 'ru' ? 'К материалам' : 'Go to materials')}
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Bottom decorative line */}
          <div className="h-px bg-gradient-to-r from-transparent via-theme-border to-transparent" />
        </div>
      </div>
    </section>
  )
}
