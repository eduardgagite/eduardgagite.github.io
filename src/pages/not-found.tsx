import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { resetSEO, updateSEO, buildPageSeoUrl } from '../utils/seo'
import { withLang } from '../i18n/url'

export function NotFound() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const lang = (i18n.resolvedLanguage || 'ru') === 'ru' ? 'ru' : 'en'
  const isRu = lang === 'ru'
  const displayPath = (() => {
    try {
      return decodeURIComponent(location.pathname)
    } catch {
      return location.pathname
    }
  })()

  useEffect(() => {
    const title = t('notFound.title') || (lang === 'ru' ? 'Страница не найдена — Eduard Gagite' : 'Page not found — Eduard Gagite')
    const description =
      t('notFound.description') ||
      (lang === 'ru' ? 'Похоже, ссылка неверная или страница была перемещена.' : 'The link looks wrong or the page has been moved.')
    const url = buildPageSeoUrl({ path: location.pathname, lang })
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
  }, [lang, location.pathname, t])

  return (
    <section className="relative h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(31,111,235,0.22),_transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.16),_transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35" />
      <div className="pointer-events-none absolute left-[-9rem] top-[-8rem] h-64 w-64 rounded-full bg-theme-accent/20 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-[-9rem] right-[-8rem] h-72 w-72 rounded-full bg-theme-primary/20 blur-[100px]" />

      <div className="relative mx-auto flex min-h-full w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full overflow-hidden rounded-[30px] border border-theme-border bg-theme-surface/90 shadow-[0_40px_120px_-56px_rgba(0,0,0,0.92)] backdrop-blur-xl">
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-theme-accent/60 to-transparent" />

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr,0.9fr] lg:gap-10 lg:p-10">
            <div className="flex flex-col justify-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-theme-text-muted">
                {isRu ? 'Ошибка маршрута' : 'Route error'}
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-theme-text sm:text-4xl lg:text-[46px]">
                {t('notFound.heading') || (isRu ? 'Страница не найдена' : 'Page not found')}
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-8 text-theme-text-subtle">
                {t('notFound.hint') ||
                  (isRu
                    ? 'Проверьте адрес или вернитесь на главную. Возможно страница была перемещена.'
                    : 'Check the URL or go back home. The page might have been moved.')}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to={withLang('/', lang)}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-theme-accent/40 bg-gradient-to-r from-theme-accent/25 to-theme-accent/10 px-5 py-2.5 text-sm font-medium text-theme-text transition-all hover:from-theme-accent/35 hover:to-theme-accent/20 hover:border-theme-accent/55"
                >
                  <svg className="h-4 w-4 text-theme-accent transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {t('notFound.goHome') || (isRu ? 'На главную' : 'Go home')}
                </Link>
                <Link
                  to={withLang('/materials', lang)}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-theme-border bg-theme-surface-elevated px-5 py-2.5 text-sm font-medium text-theme-text-secondary transition-all hover:bg-theme-card hover:border-theme-border-hover hover:text-theme-text"
                >
                  {t('notFound.goMaterials') || (isRu ? 'К материалам' : 'Go to materials')}
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-3xl border border-theme-border bg-black/30 p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_62%)]" />
                <p className="relative text-center font-display text-[clamp(96px,18vw,180px)] font-semibold leading-none tracking-tight text-theme-text/85">
                  404
                </p>
                <div className="relative mt-2 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-theme-accent">
                  {isRu ? 'страница отсутствует' : 'resource missing'}
                </div>
              </div>

              <div className="rounded-2xl border border-theme-border bg-theme-card/75 p-4 font-mono text-[13px] leading-7 text-theme-text-muted">
                <div className="break-all">
                  <span className="text-theme-accent">GET</span>{' '}
                  <span className="text-theme-text-secondary">{displayPath}{location.search}</span>
                </div>
                <div>
                  <span className="text-theme-accent">status</span>{' '}
                  <span className="text-theme-text-secondary">404 Not Found</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
